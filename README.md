# Anthropic Hiring Assessment

This is a static Next.js assessment. Candidates enter their details, grant camera and microphone access, and start a 90-minute Python assessment in full screen.

## Run locally

Use Node.js 24. The exact development version is in `.nvmrc`.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a top-level browser tab. Use HTTPS when opening the assessment on a remote device. [Browser permissions reference](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

## Candidate flow

1. Enter a full name, email address, mobile number, and college name. Select **Submit details**, then continue from the **Successfully submitted** popup.
2. Grant camera and microphone access on the device check screen. The page requests full screen after both devices connect when the browser allows it. If the browser needs another click, select **Start assessment in full screen**. The timer begins when you start. [Fullscreen API reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)
3. Write Python in the editor and explain each solution using `# comments` below the code. Each question has its own draft and undo history.
4. Submit an answer to lock it and switch to the remaining question. The second submission opens the **Assessment submitted** popup.
5. Download the combined file and send it to the recruiter. It contains the four candidate details and both answers.

Details, drafts, and submissions stay in the browser tab. A refresh restores the same deadline and asks the candidate to reconnect their devices and return to full screen. Keep the tab open until the file has been downloaded. If time expires, the candidate can download work written so far. Audio and video stay on the device. The browser releases both devices and exits full screen when the assessment ends.

The static assets contain the public question statements, and the browser manages the timer and submission state. The recruiter receives details and answers when candidates send their downloaded files. Use the reviewer guide in the original brief for manual review.

## Set assessment details

Edit `src/lib/config.ts` to set the title, support email, or privacy notice URL. To add a logo, place it in `public/` and set `logoPath` to a root-relative URL such as `/company-logo.svg`.

## Deploy to Vercel

1. Push the contents of this project folder to your Git repository.
2. Import that repository into Vercel. Select the Next.js framework preset and Node.js 24.x. The build uses the included `vercel.json` and publishes the static export from `out/`.
3. Open the preview deployment in a top-level desktop browser tab. Verify candidate registration, device permissions, full screen, and both submissions on the devices you intend to support before sharing the link.

[Next.js static export](https://nextjs.org/docs/app/guides/static-exports) · [Vercel project configuration](https://vercel.com/docs/project-configuration)

## Verification commands

```bash
npm run typecheck
npm test
npm run build
```

The automated checks cover candidate details, the two-answer completion rule, starter validation, the UTF-8 size limit, draft restoration, expiry, and answer export.

Chromium checks covered registration, both popups, the download, and the 390px layout. Synthetic device tracks and simulated full-screen permission were used because native full screen was blocked in the preview browser.
