import { notFound } from "next/navigation";
import UiDemoContent from "./UiDemoContent";

export const metadata = {
  title: "UI Component Demo",
};

export default function UiDemoPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <UiDemoContent />;
}
