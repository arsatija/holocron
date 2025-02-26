import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
    return (
        <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>
    );
}
