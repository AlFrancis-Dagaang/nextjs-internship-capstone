import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { queries } from "@/lib/db";
import { syncUserFromClerkData } from "@/lib/services/users";

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  const body = await req.text();

  const wh = new Webhook(webhookSecret);
  let event: any;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType = event.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url, has_image } =
      event.data;
    console.log("Webhook received:", eventType, id);

    const primaryEmail = email_addresses?.[0]?.email_address;
    if (!primaryEmail) {
      console.error("No email found on Clerk user event", id);
      return NextResponse.json({ error: "No email on user" }, { status: 400 });
    }

    const name = [first_name, last_name].filter(Boolean).join(" ") || "Unknown";

    const result = await syncUserFromClerkData(
      id,
      primaryEmail,
      name,
      image_url,
      has_image,
    );
    console.log("Upsert result:", result);
  }

  return NextResponse.json({ received: true });
}
