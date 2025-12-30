import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle, Inbox } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import happioLogo from '@/assets/happio-logo.png';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp, loading } = useAuth();

  const [activeTab, setActiveTab] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({ title: 'Ongeldige inloggegevens', description: 'Controleer je email en wachtwoord.', variant: 'destructive' });
        } else if (error.message.includes('Email not confirmed')) {
          toast({ title: 'Email niet bevestigd', description: 'Controleer je inbox en klik op de verificatielink.', variant: 'destructive' });
        } else {
          toast({ title: 'Inloggen mislukt', description: error.message, variant: 'destructive' });
        }
      } else {
        toast({ title: 'Welkom terug!' });
        navigate('/');
      }
    } catch (error) {
      toast({ title: 'Er ging iets mis', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (signupPassword.length < 6) {
      toast({ title: 'Wachtwoord te kort', description: 'Gebruik minimaal 6 tekens.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await signUp(signupEmail, signupPassword, signupName);
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast({ title: 'Email al in gebruik', description: 'Probeer in te loggen of gebruik een ander emailadres.', variant: 'destructive' });
        } else {
          toast({ title: 'Registratie mislukt', description: error.message, variant: 'destructive' });
        }
      } else {
        setRegisteredEmail(signupEmail);
        setShowVerificationMessage(true);
      }
    } catch (error) {
      toast({ title: 'Er ging iets mis', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show verification success screen
  if (showVerificationMessage) {
    return (
      <Layout title="Bevestig je email" noFooter>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-secondary/50 to-background p-4">
          <div className="w-full max-w-lg text-center">
            <Card className="shadow-xl">
              <CardContent className="pt-10 pb-10">
                <div className="mb-6 flex justify-center">
                  <div className="rounded-full bg-primary/10 p-6">
                    <Inbox className="h-16 w-16 text-primary" />
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold mb-4">Controleer je inbox!</h1>
                
                <p className="text-muted-foreground mb-6">
                  We hebben een verificatie-email gestuurd naar:
                </p>
                
                <p className="font-semibold text-lg mb-6 bg-secondary px-4 py-3 rounded-lg inline-block">
                  {registeredEmail}
                </p>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Volgende stappen:
                  </h3>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">1.</span>
                      Open je email inbox
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">2.</span>
                      Zoek naar een email van Happio
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">3.</span>
                      Klik op de verificatielink in de email
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">4.</span>
                      Daarna kun je inloggen!
                    </li>
                  </ol>
                </div>

                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-warning-foreground">
                    <strong>💡 Tip:</strong> Geen email ontvangen? Controleer ook je spam/ongewenste mail folder!
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowVerificationMessage(false);
                    setActiveTab('login');
                  }}
                  className="w-full"
                >
                  Terug naar inloggen
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title="Laden...">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={activeTab === 'login' ? 'Inloggen' : 'Registreren'} noFooter>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-secondary/50 to-background p-4">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug naar home
          </Link>

          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <Link to="/" className="inline-block mb-4">
                <img src={happioLogo} alt="Happio" className="h-12 mx-auto" />
              </Link>
              <CardTitle>
                {activeTab === 'login' ? 'Welkom terug' : 'Account aanmaken'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'login'
                  ? 'Log in om je favorieten en reviews te bekijken'
                  : 'Maak een gratis account aan'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Inloggen</TabsTrigger>
                  <TabsTrigger value="signup">Registreren</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="naam@voorbeeld.nl"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Wachtwoord</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Bezig...' : 'Inloggen'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Naam</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Je naam"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="naam@voorbeeld.nl"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Wachtwoord</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimaal 6 tekens"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Bezig...' : 'Account aanmaken'}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Door te registreren ga je akkoord met onze{' '}
                      <Link to="/voorwaarden" className="text-primary hover:underline">
                        voorwaarden
                      </Link>{' '}
                      en{' '}
                      <Link to="/privacy" className="text-primary hover:underline">
                        privacybeleid
                      </Link>
                      .
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
