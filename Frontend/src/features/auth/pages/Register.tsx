import { RegisterForm } from '../components/RegisterForm';

export const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-lg border border-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-2">Start managing your boards</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}