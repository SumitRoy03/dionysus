import Link from "next/link";

import { LatestPost } from "@/app/_components/post";
import { api, HydrateClient } from "@/trpc/server";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default async function Home() {
  return <Button>CLick Me</Button>
}
