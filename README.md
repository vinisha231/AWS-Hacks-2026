# AWS-Hacks-2026
//enter name here is an AWS-powered platform that helps underserved individuals discover and apply for government assistance programs, including SNAP, Medicaid, LIHEAP, housing aid, WIC, and TANF- without needing to understand the bureaucracy behind them. Instead of filling out complex forms, users have a natural-language conversation powered by Amazon Bedrock (Claude), where they simply describe their situation in their own words; the system extracts structured eligibility data automatically and surfaces every program they qualify for, ranked by dollar value, in a single unified view. All interactions are translated in real time across 75+ languages, including Haitian Creole, Vietnamese, Somali, and Arabic, via Amazon Translate, removing language as a barrier entirely. Once eligibility is confirmed, users can upload supporting documents (pay stubs, IDs, lease agreements) directly to Amazon S3, which are automatically linked to their applications in Amazon Aurora, so no one gets dropped at the form. Amazon SNS powers two critical features: proactive renewal reminders sent 30 days before a benefit expires, and a full SMS fallback path for users with limited data or no smartphone, meaning the entire intake and eligibility flow works over text message alone. Together, these features close the gaps that existing tools like mRelief and Benefits.gov leave open — giving people not just an answer to "do I qualify," but a guided path all the way through to applied, tracked, and renewed.


# Competitors 
Direct competitors:

Benefits.gov — official federal portal, but notoriously hard to navigate <br>
mRelief — SMS/chat-based SNAP screener <br> 
Aunt Bertha / Findhelp.org — large social services directory, used by hospitals and nonprofits <br>
GetYourBenefits.org — eligibility screener across multiple programs <br>
BenefitsCal — California's unified benefits portal <br>
Propel (Fresh EBT) — SNAP balance tracking + benefits discovery, 5M+ users <br>
Adjacent:

Unite Us / NowPow — used by healthcare systems to connect patients to benefits <br>
Aidkit — benefits disbursement for nonprofits/government <br>

#Features 
Good point — here's the full feature list including account/profile/settings:

**Auth & Account**
- Sign up / log in (Amazon Cognito)
- Return sessions (stay logged in)
- Delete account

**Profile**
- Name, household size, state/location
- Income details
- Number of dependents
- Employment status
- Preferred language (persists across sessions)

**Settings**
- Notification preferences (SMS, email, or both)
- Language preference
- Privacy / data sharing settings
- Update personal info

**Intake**
- Conversational intake (type naturally, no forms)
- Free-text → structured data via Bedrock
- Real-time translation via Amazon Translate

**Eligibility**
- Cross-program check (SNAP, Medicaid, LIHEAP, Section 8, WIC, TANF, local grants)
- Results ranked by dollar value
- Unified view of everything you qualify for

**Application**
- Auto-fill from intake answers
- Document upload (pay stubs, ID, lease) → S3
- Docs auto-linked to application

**Tracking**
- Application status tracker
- 30-day renewal reminders via SNS
- Application history

**Accessibility**
- SMS fallback (full flow over text)
- Low-bandwidth frontend
- 75+ languages

Want me to write this up as a formatted README section?
