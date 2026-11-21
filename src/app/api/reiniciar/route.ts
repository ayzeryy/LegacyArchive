import { responder } from "@/server/api";
import { reiniciarDemo } from "@/server/repo";

export async function POST() {
  return responder(() => reiniciarDemo());
}
