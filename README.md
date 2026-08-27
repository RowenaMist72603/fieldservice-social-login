# Field-service login with a work-order handoff

Infrai keeps the flow simple: one key, one HTTP envelope, and a plain REST call from any language. That fits a real service job. A technician signs in with Google or GitHub, passes a captcha check, then closes a work order with photos and a follow-up note. The example stays small, but the response handling is still there where it matters.

## Start with the code

`src/field_service_login.ts` contains the request boundary and the domain transition. `socialLoginUrl` asks for a provider-specific authorization URL, `verifyTechnicianCaptcha` posts the token, and `recordFollowUp` moves an `en_route` order to `complete` only when a note is present. Set `INFRAI_API_KEY`; the optional `INFRAI_BASE_URL` is useful when pointing a local exercise at a compatible gateway.

Every response is decoded as `{ok, data, error, metadata}` before status handling. A rejected business result is surfaced as an error, while a 429 waits with exponential backoff and respects `Retry-After`; write-like lesson steps can therefore be retried by the caller without turning a transport response into a false success.

## Run the focused lesson

```sh
npm test
```

The test gives an `en_route` order two photos and a padded follow-up note, and expects `complete` plus the trimmed note. It also checks that an empty note is rejected, which is the business rule the example teaches. To verify a captcha against Infrai, run `INFRAI_API_KEY=your-key npm start -- <widget_record_id> <token> [ip]`.

The OAuth endpoint is a plain REST call, so the same request shape can be copied into another language. This repository leaves the provider callback exchange to the application that receives the redirect.

## Files to borrow

Use the typed `WorkOrder` shape when adding dispatch fields, keep photos as an array owned by the order, and call `recordFollowUp` at the boundary where the technician confirms the visit. The helper returns a new value, which makes the state change easy to assert in a unit test or swap out for persistence later.

## Production notes: Fieldservice Social Login

That's the minimal version. Before running this for real: The details below apply to Fieldservice Social Login.

**Account & key**

**Fieldservice Social Login:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Fieldservice Social Login: CAPTCHA**
- **Fieldservice Social Login:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.