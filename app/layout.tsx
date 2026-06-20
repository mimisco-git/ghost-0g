import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GHOST — The AI That Cannot Be Stopped",
  description: "An autonomous AI agent built on 0G. Verifiable compute. Permanent memory. No kill switch. Not even ours.",
  openGraph: {
    title: "GHOST — The AI That Cannot Be Stopped",
    description: "Autonomous AI on 0G. No owner. No kill switch. Always on.",
    url: "https://ghost-rouge-five.vercel.app",
    images: [
      {
        url: "https://raw.githubusercontent.com/mimisco-git/ghost-0g/main/thumbnail.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GHOST — The AI That Cannot Be Stopped",
    description: "Autonomous AI on 0G. No owner. No kill switch. Always on.",
    images: ["https://raw.githubusercontent.com/mimisco-git/ghost-0g/main/thumbnail.png"],
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='%23000'/><path d='M32 8C18 8 8 18 8 32L8 56C8 56 14 50 20 56C26 62 29 56 32 56C35 56 38 62 44 56C50 50 56 56 56 56L56 32C56 18 46 8 32 8Z' fill='%2300FFD1' opacity='0.2'/><path d='M32 10C19 10 10 19 10 32L10 54C10 54 16 49 21 54C26 59 29 54 32 54C35 54 38 59 43 54C48 49 54 54 54 54L54 32C54 19 45 10 32 10Z' fill='white'/><ellipse cx='24' cy='32' rx='5' ry='6' fill='black'/><ellipse cx='24' cy='32' rx='2.5' ry='3' fill='%2300FFD1'/><ellipse cx='40' cy='32' rx='5' ry='6' fill='black'/><ellipse cx='40' cy='32' rx='2.5' ry='3' fill='%2300FFD1'/></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
