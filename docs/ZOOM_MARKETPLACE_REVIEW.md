# Zoom Marketplace documentation and review handoff

Updated: 18 November 2026. These are documentation changes, not evidence of Zoom approval or a completed runtime security review.

## Resource URLs

| Marketplace field | URL |
| --- | --- |
| Documentation | https://global.wistudi.com/support/zoom/ |
| Support | https://global.wistudi.com/support/zoom/#contact-support |
| Privacy Policy | https://global.wistudi.com/privacy/ |
| Terms of Use | https://global.wistudi.com/terms-and-conditions/ |
| Product overview | https://global.wistudi.com/zoom/ |

Company: Wistudi Publishing Ltd, company number 17458982. Use the same legal entity in the Marketplace listing. The submitted Marketplace fields must be checked in the developer portal; changing this repository does not update that portal.

Support: support@wistudi.com; Monday–Friday, 08:00–17:00 Vietnam time (ICT, UTC+7, Asia/Ho_Chi_Minh). First response within one business day, with messages outside hours handled from the next business day. An initial response is not a resolution guarantee. The existing support enquiry form routes Platform support to support@wistudi.com.

## Runtime test plan for the application review

Use two dedicated Wistudi test users, host and learner, and a prepared Flow. Supply credentials privately in the Zoom submission, never in this repository. Zoom reviewers use their own Zoom account. For a first submission, use the production client ID and the actual authorisation flow.

1. Open every resource URL signed out. Verify it is public and not blocked by a login wall or access challenge.
2. Sign in as host, open My Space → Training Rooms and Connect Zoom. Verify the requested permissions match the app's documented functions and the submitted scopes. Demonstrate administrator approval behaviour where applicable.
3. Create a room with the prepared Flow, set its opening time, copy the learner link, and enter as host. Verify the meeting opens alongside the Flow.
4. Open the link as the learner. Verify Wistudi sign-in, room opening-time checks, host-presence checks and any Zoom authentication/admission requirements. Document the actual account requirements.
5. Verify microphone, camera, audio controls and supported desktop browsers. Confirm the actual SDK view and version; the Web component view is intended for desktop, not mobile/tablet.
6. Confirm that any recording, transcription, streaming or data-access notices required for the actual SDK platform and enabled features remain visible after UI customisation. Native SDK notice APIs must not be assumed to apply unchanged to the Web SDK. Do not claim an unsupported recording feature.
7. End room and verify the meeting ends for everyone. Check the behaviour if the host loses connectivity or a plan limit is reached.
8. Disconnect within Wistudi and separately remove the app within Zoom. Confirm deauthorisation handling, token deletion and prevention of further use of the removed connection. Reconnect and test again.
9. Verify the privacy disclosure against the actual stored fields, encryption, access controls, deletion jobs and retention implementation. The prior token-deletion and non-storage statements were supplied in the existing product documentation and have not been independently proven by editing the global website. No arbitrary numerical deletion deadline was introduced.
10. If under-16 learners are supported, document eligibility through a School Subscriber using Zoom for Education (K-12), the educational configuration and required notices/permissions. General parental permission alone is not evidence of eligibility.
11. Provide a private walkthrough or demonstration video for every requested scope and feature, and keep the developer contact inbox monitored for Zoom review feedback. Recheck the current requirements when resubmitting.

## Official references

- https://developers.zoom.us/docs/build-flow/app-listing/links/
- https://developers.zoom.us/docs/distribute/app-submission/common-rejection-issues/
- https://developers.zoom.us/docs/distribute/sdk-feature-review-requirements/
- https://developers.zoom.us/docs/distribute/app-submission/privacy-review/
- https://developers.zoom.us/docs/meeting-sdk/web/browser-support/
- https://www.zoom.com/en/trust/terms/
- https://www.zoom.com/en/trust/privacy/privacy-statement/
