import React from "react";
import { getSEOMetadata } from "@/utils/seoMetadata";
import { CheckCircle } from "lucide-react";
import PrivacyPolicyHero from "@/components/ui/privacy-policy-hero";

export async function generateMetadata() {
	return getSEOMetadata("citc-ph.com", "/privacy-policy");
}

export default function PrivacyPolicyPage() {
	return (
		<div className="min-h-screen flex flex-col py-12 px-6 lg:px-28 radial-gradient-bg mt-14 2xl:mt-20">
			<main className="max-w-4xl mx-auto backdrop-blur-2xl">
				<PrivacyPolicyHero />
				<header className="mb-8">
					<h1
						className="text-4xl md:text-5xl font-bold leading-tight"
						style={{ color: "var(--primary)" }}
					>
						Privacy Policy
					</h1>
					<div className="mt-4 h-1 w-24 rounded" style={{ background: "var(--primary)" }} />
					<p className="mt-2 text-sm text-muted-foreground">Effective Date: July 1, 2025</p>
				</header>

				<article className="flex flex-col prose prose-invert max-w-none bg-card/60 gap-4 p-8 rounded-[clamp(1.25rem,4vw,1.875rem)] backdrop-blur-xl shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.05)]">
					<p>
						Your privacy matters to us at Cornerstone International Technologies
						Corp. (&quot;CIT&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). This Privacy Policy outlines
						how we collect, use, and protect your personal information when you
						interact with our website citc-ph.com.
					</p>

					  <section className="mb-4  pl-4 rounded-sm" >
						<h3 className="text-lg font-semibold" style={{ color: "var(--primary)" }}>Information We Collect</h3>
						<ul className="mt-3 space-y-3">
							<li className="flex gap-3 items-start">
								<CheckCircle className="mt-1 w-5 h-5 text-primary/80 flex-shrink-0" aria-hidden />
								<span>Personal information you voluntarily submit (e.g., name, email address).</span>
							</li>
							<li className="flex gap-3 items-start">
								<CheckCircle className="mt-1 w-5 h-5 text-primary/80 flex-shrink-0" aria-hidden />
								<span>Browser and device information (IP address, browser type, device identifiers).</span>
							</li>
							<li className="flex gap-3 items-start">
								<CheckCircle className="mt-1 w-5 h-5 text-primary/80 flex-shrink-0" aria-hidden />
								<span>Website usage data (pages visited, actions taken, time on site).</span>
							</li>
						</ul>
					</section>

					  <section className="mb-4  pl-4 rounded-sm" >
						<h3 className="text-lg font-semibold" style={{ color: "var(--primary)" }}>How We Use Your Information</h3>
						<ul className="mt-3 space-y-3">
							<li className="flex gap-3 items-start"><CheckCircle className="mt-1 w-5 h-5 text-primary/80 flex-shrink-0" aria-hidden /><span>To deliver and improve our services.</span></li>
							<li className="flex gap-3 items-start"><CheckCircle className="mt-1 w-5 h-5 text-primary/80 flex-shrink-0" aria-hidden /><span>To respond to inquiries or job applications.</span></li>
							<li className="flex gap-3 items-start"><CheckCircle className="mt-1 w-5 h-5 text-primary/80 flex-shrink-0" aria-hidden /><span>To monitor website traffic and trends using analytics tools.</span></li>
						</ul>
					</section>

					  <section className="mb-4  pl-4 rounded-sm" >
						<h3 className="text-lg font-semibold" style={{ color: "var(--primary)" }}>Cookies &amp; Tracking</h3>
						<p>
						Our site uses cookies and similar technologies to enhance your
						experience and analyze usage. You can disable cookies through your
						browser settings if you prefer. Note that disabling cookies may
						affect certain features or functionality of the site.
										</p>
									</section>

									<hr className="my-6 border-t border-muted/20" />
					  <section className="mb-4  pl-4 rounded-sm" >
						<h3 className="text-lg font-semibold" style={{ color: "var(--primary)" }}>Third-Party Services</h3>
						<p>
						We do not share mobile information with third parties or affiliates
						for marketing or promotional purposes. We exclude text message
						originator opt-in data and consent from any data-sharing; such
						consented data will not be shared with third parties for
						promotional uses.
											</p>
										</section>

										<section className="mb-4  pl-4 rounded-sm" >
						<h3 className="text-lg font-semibold" style={{ color: "var(--primary)" }}>Your Rights</h3>
						<p>
						You may request access to, correction, or deletion of your personal
						information at any time. To make a request, please email us at
						<a className="underline ml-1" href="mailto:privacy@citc-ph.com">privacy@citc-ph.com</a>.
										</p>
									</section>

					<section className="mb-4  pl-4 rounded-sm" >
						<h3 className="text-lg font-semibold" style={{ color: "var(--primary)" }}>Updates to This Policy</h3>
						<p>
						We reserve the right to update this Privacy Policy periodically. The
						latest version will always be available on this page, with an
						updated effective date.
                        </p>
                    </section>

                    <section className="mb-4  pl-4 rounded-sm" >
                        <h3 className="text-lg font-semibold" style={{ color: "var(--primary)" }}>Contact Us</h3>
                        <p>For questions regarding this Privacy Policy, please contact:</p>
                        <address className="not-italic">
                            Cornerstone International Technologies Corp.<br />
                            Email: <a className="underline" href="mailto:privacy@citc-ph.com">privacy@citc-ph.com</a>
                        </address>
                        <div className="mt-6 flex items-center gap-4">
                            <a href="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary/80 underline">View our Terms & Conditions</a>
                        </div>
                    </section>
                </article>
			</main>
		</div>
	);
}

