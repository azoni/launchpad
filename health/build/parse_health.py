#!/usr/bin/env python3
"""
Stream-parse a ~1GB Apple Health export.xml into a compact daily-aggregate JSON.

Design notes / methodology:
- Steps / Distance / Flights are reported by BOTH the iPhone and the Apple Watch
  for the same real-world activity. Naively summing double-counts. We aggregate
  per source per day, then take max(watch, phone) for the day -- this never
  double-counts (picks a single source) yet keeps the fuller record on days the
  watch was only worn part-time.
- Active energy / Exercise minutes / Stand hours come from Apple's own
  ActivitySummary (the Move/Exercise/Stand rings), already de-duplicated by Apple.
- Heart-rate family (resting, walking avg, HRV, VO2, resp rate, SpO2) come only
  from the watch -> no source conflict; averaged per day (min/max tracked for HR).
- Sleep is assigned to the wake-up date; this export is almost entirely "InBed"
  segments, so we report time-in-bed hours (limited signal, flagged in the UI).
"""
import xml.etree.ElementTree as ET
import json, sys, datetime, collections

# Point SRC at your unzipped Apple Health export.xml, then run from this build/ dir.
SRC = "/Users/dustbunny/Documents/Meme/apple_health_export/export.xml"
OUT = "health_data.json"

def day_of(s):
    # startDate like "2023-05-16 11:49:00 -0700" -> local calendar date already
    return s[:10] if s else None

def fdt(s):
    # "2022-10-13 23:27:51 -0700"
    try:
        return datetime.datetime.strptime(s, "%Y-%m-%d %H:%M:%S %z")
    except Exception:
        return None

# per-day accumulators
steps = collections.defaultdict(lambda: {"watch": 0.0, "phone": 0.0})
dist  = collections.defaultdict(lambda: {"watch": 0.0, "phone": 0.0})
flights = collections.defaultdict(lambda: {"watch": 0.0, "phone": 0.0})

# avg-style metrics: day -> [sum, count, min, max]
def acc(): return [0.0, 0, float("inf"), float("-inf")]
hr   = collections.defaultdict(acc)   # all heart-rate samples
resting = collections.defaultdict(acc)
walkhr  = collections.defaultdict(acc)
hrv     = collections.defaultdict(acc)
vo2     = collections.defaultdict(acc)
resp    = collections.defaultdict(acc)
spo2    = collections.defaultdict(acc)

# basal (resting) energy from BasalEnergyBurned records (Watch-only, single source): day -> Cal
basal = collections.defaultdict(float)

# from ActivitySummary (Apple's deduped rings): day -> dict
rings = {}

# sleep: day(wake) -> seconds in bed/asleep
sleep_iv = collections.defaultdict(list)  # wake-date -> [(start_ts, end_ts)] for union

workouts = []

def addavg(d, day, v):
    a = d[day]; a[0]+=v; a[1]+=1
    if v<a[2]: a[2]=v
    if v>a[3]: a[3]=v

QT = "HKQuantityTypeIdentifier"
CT = "HKCategoryTypeIdentifier"

n = 0
in_corr = False  # guard (none here, but safe)

context = ET.iterparse(SRC, events=("start", "end"))
_, root = next(context)

for event, elem in context:
    tag = elem.tag
    if event == "start":
        if tag == "Correlation":
            in_corr = True
        continue

    # event == "end"
    if tag == "Correlation":
        in_corr = False
        elem.clear(); root.clear(); continue

    if tag == "Record" and not in_corr:
        t = elem.get("type", "")
        sd = elem.get("startDate")
        day = day_of(sd)
        if day is None:
            elem.clear(); root.clear(); continue
        src = elem.get("sourceName", "")
        is_watch = "Watch" in src
        val = elem.get("value")

        if t == QT + "StepCount":
            v = float(val); steps[day]["watch" if is_watch else "phone"] += v
        elif t == QT + "DistanceWalkingRunning":
            v = float(val); dist[day]["watch" if is_watch else "phone"] += v
        elif t == QT + "FlightsClimbed":
            v = float(val); flights[day]["watch" if is_watch else "phone"] += v
        elif t == QT + "HeartRate":
            addavg(hr, day, float(val))
        elif t == QT + "RestingHeartRate":
            addavg(resting, day, float(val))
        elif t == QT + "WalkingHeartRateAverage":
            addavg(walkhr, day, float(val))
        elif t == QT + "HeartRateVariabilitySDNN":
            addavg(hrv, day, float(val))
        elif t == QT + "VO2Max":
            addavg(vo2, day, float(val))
        elif t == QT + "RespiratoryRate":
            addavg(resp, day, float(val))
        elif t == QT + "OxygenSaturation":
            addavg(spo2, day, float(val) * 100.0)  # fraction -> %
        elif t == QT + "BasalEnergyBurned":
            basal[day] += float(val)               # resting energy; total = active + basal
        elif t == CT + "SleepAnalysis":
            if val and ("Asleep" in val or "InBed" in val):
                a = fdt(elem.get("startDate")); b = fdt(elem.get("endDate"))
                if a and b and b > a:
                    wake = elem.get("endDate")[:10]
                    # store the interval; overlapping InBed/Asleep segments (phone + watch
                    # covering the same night) are merged by union later, not summed.
                    sleep_iv[wake].append((a.timestamp(), b.timestamp()))

        n += 1
        if n % 200000 == 0:
            print(f"...{n:,} records", file=sys.stderr)
        elem.clear(); root.clear(); continue

    if tag == "ActivitySummary":
        d = elem.get("dateComponents")
        if d:
            def gf(k):
                try: return float(elem.get(k))
                except (TypeError, ValueError): return None
            rings[d] = {
                "activeEnergy": gf("activeEnergyBurned"),
                "activeEnergyGoal": gf("activeEnergyBurnedGoal"),
                "exerciseMin": gf("appleExerciseTime"),
                "exerciseGoal": gf("appleExerciseTimeGoal"),
                "standHours": gf("appleStandHours"),
                "standGoal": gf("appleStandHoursGoal"),
            }
        elem.clear(); root.clear(); continue

    if tag == "Workout":
        wt = elem.get("workoutActivityType", "").replace("HKWorkoutActivityType", "")
        sd = elem.get("startDate")
        day = day_of(sd)
        dur = elem.get("duration")
        try: dur = float(dur)
        except (TypeError, ValueError): dur = None
        # energy/distance may live on the element or in WorkoutStatistics children
        tdist = elem.get("totalDistance"); tenergy = elem.get("totalEnergyBurned")
        whr_sum = whr_n = 0
        for st in elem.findall("WorkoutStatistics"):
            stt = st.get("type", "")
            if stt.endswith("ActiveEnergyBurned") and tenergy is None:
                tenergy = st.get("sum")
            elif stt.endswith("DistanceWalkingRunning") and tdist is None:
                tdist = st.get("sum")
            elif stt.endswith("HeartRate"):
                av = st.get("average")
                if av:
                    whr_sum += float(av); whr_n += 1
        def num(x):
            try: return round(float(x), 2)
            except (TypeError, ValueError): return None
        workouts.append({
            "date": day, "type": wt,
            "durationMin": round(dur, 1) if dur is not None else None,
            "distanceMi": num(tdist), "energyCal": num(tenergy),
            "avgHR": round(whr_sum / whr_n) if whr_n else None,
        })
        elem.clear(); root.clear(); continue

    # Other end events (WorkoutStatistics, MetadataEntry, WorkoutRoute, …) are children of
    # a top-level element. Do NOT clear them here: clearing a WorkoutStatistics on its own
    # end event wipes its attributes before the parent Workout is processed. They are freed
    # when the parent Record/Workout calls elem.clear().

print(f"parsed {n:,} records total", file=sys.stderr)

# ---- merge sleep intervals per night (union, so overlaps don't double count) ----
sleep = {}
for wake, ivs in sleep_iv.items():
    ivs.sort()
    total = 0.0; cur_s, cur_e = ivs[0]
    for s, e in ivs[1:]:
        if s <= cur_e:
            cur_e = max(cur_e, e)
        else:
            total += cur_e - cur_s; cur_s, cur_e = s, e
    total += cur_e - cur_s
    sleep[wake] = total

# ---- build compact daily records ----
all_days = set()
for d in (steps, dist, flights, hr, resting, walkhr, hrv, vo2, resp, spo2, sleep, basal, rings):
    all_days.update(d.keys())

def mx(d, day):
    if day not in d: return None
    v = max(d[day]["watch"], d[day]["phone"])
    return round(v) if v else None

def mean(d, day, r=0):
    if day not in d or d[day][1] == 0: return None
    return round(d[day][0] / d[day][1], r) if r else round(d[day][0] / d[day][1])

days_out = {}
for day in sorted(all_days):
    if day < "2000" or day > "2026-12-31":  # guard against garbage dates
        continue
    rec = {}
    v = mx(steps, day);   rec["steps"] = v if v else rec.get("steps")
    dv = dist.get(day)
    if dv:
        dd = max(dv["watch"], dv["phone"])
        if dd: rec["distance"] = round(dd, 2)
    fv = mx(flights, day)
    if fv: rec["flights"] = fv
    r = rings.get(day)
    if r:
        if r["activeEnergy"] is not None: rec["activeEnergy"] = round(r["activeEnergy"])
        if r["exerciseMin"] is not None: rec["exerciseMin"] = round(r["exerciseMin"])
        if r["standHours"] is not None: rec["standHours"] = round(r["standHours"])
        if r["activeEnergyGoal"]: rec["activeEnergyGoal"] = round(r["activeEnergyGoal"])
        if r["exerciseGoal"]: rec["exerciseGoal"] = round(r["exerciseGoal"])
        if r["standGoal"]: rec["standGoal"] = round(r["standGoal"])
    bz = basal.get(day, 0.0)
    if bz > 0:
        rec["basalEnergy"] = round(bz)
        if "activeEnergy" in rec:                         # total = Move ring + resting
            rec["totalEnergy"] = round(rec["activeEnergy"] + bz)
    m = mean(resting, day)
    if m: rec["restingHR"] = m
    m = mean(walkhr, day)
    if m: rec["walkingHR"] = m
    m = mean(hrv, day, 1)
    if m: rec["hrv"] = m
    m = mean(vo2, day, 1)
    if m: rec["vo2"] = m
    m = mean(resp, day, 1)
    if m: rec["respRate"] = m
    m = mean(spo2, day, 1)
    if m: rec["spo2"] = m
    if day in hr and hr[day][1]:
        rec["hrAvg"] = round(hr[day][0] / hr[day][1])
        rec["hrMin"] = round(hr[day][2])
        rec["hrMax"] = round(hr[day][3])
    if day in sleep:
        h = sleep[day] / 3600.0
        if h > 0: rec["sleepHours"] = round(h, 1)
    if rec:
        days_out[day] = rec

workouts = [w for w in workouts if w["date"]]
workouts.sort(key=lambda w: w["date"])

out = {
    "meta": {
        "generatedFrom": "Apple Health export.xml",
        "recordsParsed": n,
        "dayCount": len(days_out),
        "firstDay": min(days_out) if days_out else None,
        "lastDay": max(days_out) if days_out else None,
        "workoutCount": len(workouts),
        "notes": {
            "steps_distance_flights": "per-day max(watch, phone) to avoid double counting",
            "rings": "activeEnergy/exerciseMin/standHours from Apple ActivitySummary (deduped)",
            "sleep": "time in bed (mostly InBed segments); limited/sparse signal",
        },
    },
    "days": days_out,
    "workouts": workouts,
}

with open(OUT, "w") as f:
    json.dump(out, f, separators=(",", ":"))
print(f"wrote {OUT}: {len(days_out)} days, {len(workouts)} workouts", file=sys.stderr)
