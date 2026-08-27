import assert from "node:assert/strict";
import { recordFollowUp, type WorkOrder } from "./field_service_login.ts";

const order: WorkOrder = { id: "WO-7", photoUrls: ["before.jpg", "after.jpg"], dispatchStatus: "en_route" };
const completed = recordFollowUp(order, " Confirmed the repair with the customer. ");
assert.equal(completed.dispatchStatus, "complete");
assert.equal(completed.technicianFollowUp, "Confirmed the repair with the customer.");
assert.deepEqual(completed.photoUrls, order.photoUrls);
assert.throws(() => recordFollowUp(order, "  "), /required/);
console.log("follow-up decision: complete");
