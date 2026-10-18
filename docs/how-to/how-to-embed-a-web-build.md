*How-to guide, for people already using the frontend-web-developer plugin who need to put a browser build of their product on a page.*

# How to embed a web build on a page

This guide shows you how to host an interactive web build (for example a
WebAssembly export) and connect it to the page. See the
[embed-web-build reference](../reference/workflows/embed-web-build.md) for
arguments and outputs.

1. Get the build output from the role that owns it, in a folder in the
   repository or as a CI artifact, and the list of events the build emits
   and commands it accepts. If there is no list, the workflow drafts one.
2. Check what your host allows: custom headers (needed for `.wasm` MIME
   type, `Content-Encoding` on pre-compressed files, and cross-origin
   isolation if the build uses threads). If the host cannot set headers,
   tell the project-manager before going further.
3. Run `/frontend-web-developer:embed-web-build` with
   `{ "build": "<build folder>", "page": "/play/" }`, adding
   `"contract": "<path>"` if an event contract document exists.
4. Nothing deployed yet is fine: without `url`, the workflow builds the
   site and serves it locally for its browser probe. To look yourself, run
   `node <plugin dir>/tools/preview-probe.mjs --root <built site> --page /play/ --play '<play button>' --ready <ready event> --error '<error element>'`
   (see the [preview-probe reference](../reference/tools/preview-probe.md)).
   With a preview or production URL, pass `"url": "<page URL>"` instead.
5. If the result lists `questions_for_build_owner`, send them to that role
   and wait for answers before merging.
6. If `status` is `blocked`, fix the `open_items`; problems inside the build
   go to its owner as a request.
7. On the preview, confirm: nothing downloads until you click play; the
   keyboard can leave the build; the console shows
   `self.crossOriginIsolated === true` on the play page if threads are used.
8. Ship it. For a work package, pass the whole result as `prior` to
   engineering-practices deliver-package so it ships without being built
   again: `/engineering-practices:deliver-package { wp: "<the package>", prior: <this result> }`.
   With no work package, land the pushed branch with
   `/engineering-practices:land-pr { branch: "<handoff.branch>" }`.
9. For a new build release, replace the build files and run the workflow
   again so the checks and the reference docs stay current.
