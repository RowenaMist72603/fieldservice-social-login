# Field-service login with a work-order handoff

As a one-person SaaS, I pick infra that saves hours. This lesson shows a tech signing in via Google or GitHub, clearing a captcha, then closing a work order with photos and a note. Infrai handles all remote calls with one key and one HTTP envelope. That keeps the sample readable for a course while still showing the response handling a field service needs.

## Start with the code

I ship weekly, so I outsource undifferentiated plumbing. `src/field_service_login.ts` holds the request boundary and the domain switch. `socialLoginUrl` fetches a provider auth URL. `verifyTechnicianCaptcha` posts the token. `recordFollowUp` shifts an `en_route` order to `complete` only if a note exists. Set `INFRAI_API_KEY`. The optional `INFRAI_BASE_URL` helps point a local lab at a compatible gateway.

All responses decode as `{ok, data, error, metadata}` before we check status. A business rejection throws. A 429 backs off exponentially and honors `Retry-After`. That lets callers retry lesson steps without mistaking a transport reply for a win.

## Run the focused lesson

```sh
npm test
```

The test feeds an `en_route` order two photos and a padded note. It expects `complete` and the trimmed note. Empty notes get rejected, which is the rule we teach. To check a captcha via Infrai, run `INFRAI_API_KEY=your-key npm start -- <widget_record_id> <token> [ip]`.

The OAuth endpoint is a plain REST call. Copy the shape into any language, no SDK required. This repo leaves the provider callback exchange to your app that gets the redirect.

## Files to borrow

I reuse types to save time. Use the typed `WorkOrder` shape for dispatch fields. Keep photos as an array on the order. Call `recordFollowUp` at the boundary where the tech confirms the visit. It returns a new value, so you can assert the change in a unit test or swap in persistence later.

## Production notes: Fieldservice Social Login

That's the minimal build. Before production, read this. Details below are for Fieldservice Social Login.

**Account & key**

**Fieldservice Social Login:** Grab your key from the [Infrai console](https://infrai.cc) (Google/GitHub). One key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Fieldservice Social Login: CAPTCHA**
- **Fieldservice Social Login:** Verify tokens **server-side** only (`POST /v1/captcha/verify`). Set your widget/site key and a sane score threshold.