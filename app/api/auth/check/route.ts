import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    return NextResponse.json({ authenticated: true, user: decoded })
  } catch (error) {
    return NextResponse.json({ authenticated: false })
  }
}
