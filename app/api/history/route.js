import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { supabase } from "../../../lib/supabase"; 

export async function GET() {
  try {
    const { isAuthenticated, getUser } = getKindeServerSession();
    const isUserAuthenticated = await isAuthenticated();
    
    if (!isUserAuthenticated) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUser();
    const kindeId = user.id;

    // Fetch the latest 50 generations for this specific user
    const { data, error } = await supabase
      .from('generation_history')
      .select('*')
      .eq('kinde_id', kindeId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return Response.json({ history: data });

  } catch (error) {
    console.error("Error fetching history:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}