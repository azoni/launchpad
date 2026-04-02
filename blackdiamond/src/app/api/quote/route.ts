import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, phone, services, propertyType, details, preferredDate, notes } = body;

    if (!name || !email || !phone || !services || services.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const adminDb = getAdminDb();
    await adminDb.collection(COLLECTIONS.quotes).add({
      name,
      email,
      phone,
      services,
      propertyType: propertyType || "residential",
      details: details || "",
      preferredDate: preferredDate || "",
      notes: notes || "",
      status: "new",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save quote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
