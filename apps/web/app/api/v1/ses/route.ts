import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	console.log("was here");

	return NextResponse.json({
		yay: 5,
	});
}
