"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Props = {
  applicationId: string;
};

export default function TenantNav({ applicationId }: Props) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const withToken = (pathname: string) => {
    if (!token) {
      return pathname;
    }
    return `${pathname}?token=${encodeURIComponent(token)}`;
  };

  return (
    <>
      <Link href={withToken(`/${applicationId}/posts`)}>Posts</Link>
      <Link href={withToken(`/${applicationId}/articles`)}>Articles</Link>
      <Link href={withToken(`/${applicationId}/gallery`)}>Gallery</Link>
      <Link href={withToken(`/${applicationId}/photos`)}>Photos</Link>
      <Link href={withToken(`/${applicationId}/videos`)}>Videos</Link>
    </>
  );
}
