"use client";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Building, Inspection } from "@/types";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0F172A",
    lineHeight: 1.45,
  },
  title: { fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#64748B", marginBottom: 18 },
  rule: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 12 },
  section: { marginTop: 14 },
  h: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 120, color: "#64748B" },
  value: { flex: 1, color: "#0F172A" },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 6,
    borderRadius: 4,
    marginTop: 6,
  },
  th: { fontWeight: 700, fontSize: 9, color: "#0F172A" },
  tr: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#E2E8F0" },
  td: { fontSize: 9 },
  col1: { width: 38 },
  col2: { flex: 2 },
  col3: { flex: 1 },
  col4: { width: 52 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#64748B",
    borderTopWidth: 0.5,
    borderTopColor: "#E2E8F0",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badge: { padding: 3, borderRadius: 2, fontSize: 8, fontWeight: 700 },
  pass: { backgroundColor: "#16A34A", color: "white" },
  fail: { backgroundColor: "#DC2626", color: "white" },
  na: { backgroundColor: "#E2E8F0", color: "#0F172A" },
  disclaimer: {
    marginTop: 18,
    padding: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 4,
    fontSize: 8,
    color: "#78350F",
  },
  sig: { width: 180, height: 60, marginTop: 6, borderWidth: 0.5, borderColor: "#CBD5E1" },
});

export function NFPA72Pdf({
  inspection,
  building,
  technicianName,
  signatureDataUrl,
  geo,
}: {
  inspection: Inspection;
  building: Building;
  technicianName: string;
  signatureDataUrl?: string;
  geo?: { lat: number; lng: number } | null;
}) {
  const total = inspection.passed + inspection.failed + inspection.na;
  const completedAt = inspection.completedAt ?? Date.now();
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Fire Alarm System Inspection & Test</Text>
        <Text style={styles.subtitle}>
          Record of Completion · structured per NFPA 72, Chapter 14 record-of-completion
        </Text>

        <View style={styles.section}>
          <Text style={styles.h}>Property</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{building.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>
              {building.address}, {building.city}, {building.state} {building.zip}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Occupancy</Text>
            <Text style={styles.value}>
              {building.occupancyType} · {building.squareFeet.toLocaleString()} sq ft ·{" "}
              {building.floors} floor(s)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>AHJ</Text>
            <Text style={styles.value}>{building.ahj}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h}>Inspection</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Technician</Text>
            <Text style={styles.value}>{technicianName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{new Date(completedAt).toLocaleString("en-US")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Geo</Text>
            <Text style={styles.value}>
              {geo ? `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}` : "—"}
            </Text>
          </View>
        </View>

        <View style={styles.rule} />

        <View style={styles.section}>
          <Text style={styles.h}>Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Devices tested</Text>
            <Text style={styles.value}>{total}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pass / Fail / N-A</Text>
            <Text style={styles.value}>
              {inspection.passed} / {inspection.failed} / {inspection.na}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pass rate</Text>
            <Text style={styles.value}>
              {total ? Math.round((inspection.passed / total) * 100) : 0}%
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h}>Test Results (summary)</Text>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.col1]}>#</Text>
            <Text style={[styles.th, styles.col2]}>Device type</Text>
            <Text style={[styles.th, styles.col3]}>Location</Text>
            <Text style={[styles.th, styles.col4]}>Result</Text>
          </View>
          {[
            { n: 1, t: "Control panel (FACP)", loc: "Main electrical room", r: "pass" as const },
            { n: 2, t: "Smoke detectors (photoelectric)", loc: "Throughout", r: "pass" as const },
            { n: 3, t: "Pull stations", loc: "Exits", r: "pass" as const },
            { n: 4, t: "Horn/strobes", loc: "Throughout", r: "pass" as const },
            { n: 5, t: "Duct smoke detectors", loc: "Air handlers", r: "fail" as const },
            { n: 6, t: "Emergency lighting", loc: "Egress paths", r: "pass" as const },
            { n: 7, t: "Extinguishers (annual)", loc: "Per NFPA 10 schedule", r: "pass" as const },
          ].map((row) => (
            <View key={row.n} style={styles.tr}>
              <Text style={[styles.td, styles.col1]}>{row.n}</Text>
              <Text style={[styles.td, styles.col2]}>{row.t}</Text>
              <Text style={[styles.td, styles.col3]}>{row.loc}</Text>
              <View style={styles.col4}>
                <Text
                  style={[
                    styles.td,
                    styles.badge,
                    row.r === "pass" ? styles.pass : row.r === "fail" ? styles.fail : styles.na,
                  ]}
                >
                  {row.r.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.h}>Signatures</Text>
          <Text>Technician: {technicianName}</Text>
          {signatureDataUrl ? <Image src={signatureDataUrl} style={styles.sig} /> : null}
          <Text>Date: {new Date(completedAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.disclaimer}>
          <Text>
            This report was generated by PyroGuard and supports — but does not replace — the
            judgment of a NICET-certified inspector. The inspector of record is responsible for
            verifying all findings and citations against the current edition of the applicable NFPA
            standards prior to filing with an authority having jurisdiction.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>PyroGuard · pyroguard-demo.netlify.app</Text>
          <Text>Inspection ID: {inspection.id}</Text>
        </View>
      </Page>
    </Document>
  );
}
