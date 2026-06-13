import { config } from "dotenv";
config({ path: ".env.local" });

import { signInWithPassword } from "../../src/lib/actions/auth";
import { createEvent } from "../../src/lib/actions/admin-events";

async function run() {
  console.log("Starting diagnostic loop...");
  
  const loginRes = await signInWithPassword("dharmikrathod@example.com", "AdminPassword123!");
  console.log("Login result:", loginRes);

  for (let i = 0; i < 15; i++) {
    const start = Date.now();
    const res = await createEvent({
      slug: `diag-loop-${i}-${Math.random().toString(36).substring(2, 8)}`,
      title: `Diag Event ${i}`,
      description: "desc",
      category: "other",
      startAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      endAt: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
      venueName: "Venue",
      venueAddress: "Address",
      venueMapUrl: "",
      capacity: 10,
      pricePaise: 0,
      paymentMode: "free",
      refundPolicy: "No refunds.",
    });
    console.log(`Event ${i} result:`, res.success, res.message || "", `took ${Date.now() - start}ms`);
  }
}

run();
