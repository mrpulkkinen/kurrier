"use client";
import React from "react";
import { signOut } from "@/lib/actions/auth";

function DashboardPage() {
	return (
		<div>
			<button onClick={() => signOut()}>Signout</button>
		</div>
	);
}

export default DashboardPage;
