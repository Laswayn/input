import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "pahlawan140"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ username, authenticated: true }, process.env.JWT_SECRET!, { expiresIn: "1h" })

      const response = NextResponse.json({
        success: true,
        message: "Login berhasil",
      })

      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600, // 1 hour
      })

      return response
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Username atau password salah!",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server",
      },
      { status: 500 },
    )
  }
}
