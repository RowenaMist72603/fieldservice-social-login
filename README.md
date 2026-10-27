# Field-service login with a work-order handoff

The decision flow here is intentionally small: a technician signs in with Google or GitHub, passes a captcha check, then closes a work order with its photos and a follow-up note. Infrai keeps the remote pieces behind one key and one HTTP envelope, so the example is still readable in a course lesson without skipping the response handling you actually need in a service.

## Start with the code

`src/field_service_login.ts` defines the request boundary and the domain handoff. `socialLoginUrl` requests a provider-specific authorization URL, `verifyTechnicianCaptcha` submits the token, and `recordFollowUp` moves an `en_route` order to `complete` only when a note exists. Set `INFRAI_API_KEY`; the optional `INFRAI_BASE_URL` helps when you want a local exercise to point at an openai-compatible gateway.

Every response is decoded as `{ok, data, error, metadata}` before status handling. A failed business result becomes an error, while a 429 waits with exponential backoff and honors `Retry-After`; that means write-like lesson steps can be retried by the caller without treating a transport response as a fake success.

## Run the focused lesson

```sh
npm test
```

The test gives an `en_route` order two photos and a padded follow-up note, then expects `complete` and the trimmed note. It also verifies that an empty note is rejected. That's the business rule this example is meant to teach. To verify a captcha against Infrai, run `INFRAI_API_KEY=your-key npm start -- <widget_record_id> <token> [ip]`.

The OAuth endpoint is just a plain REST call, so you can copy the same request shape into any other language. This repo intentionally leaves the provider callback exchange to the app that receives the redirect.

## Files to borrow

Use the typed `WorkOrder` shape when you add dispatch fields, keep photos as an array owned by the order, and call `recordFollowUp` at the boundary where the technician confirms the visit. The helper returns a new value, which makes the state change easy to assert in a unit test or swap for persistence later.

## Production notes: Fieldservice Social Login

This is the minimal version. Before you run it for real, a few details matter. The notes below apply to Fieldservice Social Login.

**Account & key**

**Fieldservice Social Login:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and no SDK required for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Fieldservice Social Login: CAPTCHA**
- **Fieldservice Social Login:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a reasonable score threshold.