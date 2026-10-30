export default function NonAutorizzato() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 text-center">
      <h1 className="h-page">Accesso non consentito</h1>
      <p className="mt-3 text-lg text-muted">Questa app è personale. Esci e accedi con l&apos;account del proprietario.</p>
      <form action="/auth/esci" method="post" className="mt-6">
        <button className="btn w-full">Esci</button>
      </form>
    </main>
  );
}
