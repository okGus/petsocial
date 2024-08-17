import UserPage from "../../component/UserPage";
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <SignedOut>
        <div className="flex justify-center p-5">
          <SignIn routing="hash"/>
        </div>
      </SignedOut>
      <SignedIn>
        <UserPage />
      </SignedIn>
    </main>
  );
}
