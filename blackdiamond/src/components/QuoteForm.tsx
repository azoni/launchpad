"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics/posthog";

const SERVICE_OPTIONS = [
  { id: "driveway", label: "Driveway Pressure Washing" },
  { id: "windows", label: "Window Soft Washing" },
  { id: "roof", label: "Roof Cleaning" },
] as const;

type ServiceId = (typeof SERVICE_OPTIONS)[number]["id"];

export function QuoteForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState<ServiceId[]>([]);
  const [propertyType, setPropertyType] = useState<"residential" | "commercial">("residential");
  const [details, setDetails] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function toggleService(id: ServiceId) {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (services.length === 0) {
      setErrorMsg("Please select at least one service.");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          services,
          propertyType,
          details,
          preferredDate,
          notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setStatus("success");
      trackEvent("quote_submitted", { services, propertyType });
    } catch {
      setStatus("error");
      setErrorMsg(
        "Something went wrong. Please call us or try again later.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-teal mx-auto mb-4" />
        <h3 className="font-heading text-2xl uppercase tracking-wide mb-2">
          Quote Request Received
        </h3>
        <p className="text-muted-foreground">
          Thanks, {name}! We&apos;ll review your request and get back to you
          within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">
            Full Name *
          </label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
            Phone *
          </label>
          <Input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(406) 555-1234"
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">
          Email *
        </label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
        />
      </div>

      {/* Services */}
      <div>
        <p className="text-sm font-medium mb-2">
          Services Needed * <span className="text-muted-foreground font-normal">(select all that apply)</span>
        </p>
        <div className="flex flex-wrap gap-3">
          {SERVICE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleService(opt.id)}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-all duration-200 ${
                services.includes(opt.id)
                  ? "bg-teal text-white border-teal"
                  : "bg-card border-border text-foreground hover:border-teal"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div>
        <p className="text-sm font-medium mb-2">Property Type</p>
        <div className="flex gap-3">
          {(["residential", "commercial"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPropertyType(type)}
              className={`px-4 py-2 rounded-md border text-sm font-medium capitalize transition-all duration-200 ${
                propertyType === type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground hover:border-primary"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div>
        <label htmlFor="details" className="block text-sm font-medium mb-1.5">
          Property Details
          <span className="text-muted-foreground font-normal">
            {" "}(sq ft, number of windows, roof type, etc.)
          </span>
        </label>
        <Input
          id="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="e.g., 2,000 sq ft driveway, 24 windows, asphalt shingle roof"
        />
      </div>

      {/* Preferred Date */}
      <div>
        <label
          htmlFor="preferredDate"
          className="block text-sm font-medium mb-1.5"
        >
          Preferred Timeframe
        </label>
        <Input
          id="preferredDate"
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
          placeholder="e.g., Next week, mid-May, ASAP"
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1.5">
          Anything Else?
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special access instructions, specific problem areas, questions..."
          rows={3}
        />
      </div>

      {errorMsg && (
        <p className="text-destructive text-sm">{errorMsg}</p>
      )}

      <Button
        type="submit"
        disabled={status === "submitting"}
        className="w-full bg-teal text-white hover:bg-teal/90 font-heading uppercase tracking-wider py-3 h-auto"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Quote Request"
        )}
      </Button>
    </form>
  );
}
