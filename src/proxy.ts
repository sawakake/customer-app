export { auth as proxy } from "@/auth";

export const config = {
  // 保護したいパスを指定（これ以外のパスはログイン不要）
  // /register や /admin/login 以外は基本的に制限をかける
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|register).*)"],
};
