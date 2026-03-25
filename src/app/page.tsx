import Link from "next/link";

const EXAMPLE_PROMPTS = [
  "Make me a weekly schedule for college. I have classes Monday and Wednesday from 10 AM to 2 PM, want to study 2 hours a day, go to the gym 4 times a week, and sleep by midnight.",
  "Create a weekday routine where I wake up at 7, work 9 to 5, and do interview prep in the evenings.",
  "Build me a balanced weekly plan with coding practice, gym, meals, and breaks.",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="text-xl font-bold tracking-tight text-gray-900">
          fortress
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-fortress-50 text-fortress-700 text-xs font-medium mb-6">
            AI-powered calendar builder
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Describe your schedule.
            <br />
            <span className="text-fortress-600">Fortress builds it.</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
            Turn a plain-language description into a structured, editable
            calendar in seconds. Just say what you need — Fortress handles the
            rest.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center px-8 py-3 bg-gray-900 text-white rounded-xl text-base font-medium hover:bg-gray-800 transition-colors shadow-sm"
          >
            Get started free
          </Link>
        </div>

        {/* Example prompts */}
        <div className="max-w-4xl mx-auto mt-20 w-full">
          <p className="text-sm text-gray-400 text-center mb-6">
            Try describing a schedule like...
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {EXAMPLE_PROMPTS.map((prompt, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-xl p-5 text-sm text-gray-600 leading-relaxed shadow-sm"
              >
                &ldquo;{prompt}&rdquo;
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mt-24 w-full">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Describe",
                desc: "Type what your ideal week looks like — classes, work, gym, study time, sleep schedule.",
              },
              {
                step: "2",
                title: "Generate",
                desc: "Fortress uses AI to create a structured weekly calendar based on your description.",
              },
              {
                step: "3",
                title: "Edit & Refine",
                desc: "Drag events around, resize them, or type another instruction to refine your schedule.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-fortress-100 text-fortress-700 font-semibold text-sm flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-gray-400 border-t border-gray-100">
        Fortress — AI Calendar Builder
      </footer>
    </div>
  );
}
