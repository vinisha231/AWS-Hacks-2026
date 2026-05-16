# AWS-Hacks-2026
//enter name here is an AWS-powered platform that helps underserved individuals discover and apply for government assistance programs, including SNAP, Medicaid, LIHEAP, housing aid, WIC, and TANF- without needing to understand the bureaucracy behind them. Instead of filling out complex forms, users have a natural-language conversation powered by Amazon Bedrock (Claude), where they simply describe their situation in their own words; the system extracts structured eligibility data automatically and surfaces every program they qualify for, ranked by dollar value, in a single unified view. All interactions are translated in real time across 75+ languages, including Haitian Creole, Vietnamese, Somali, and Arabic, via Amazon Translate, removing language as a barrier entirely. Once eligibility is confirmed, users can upload supporting documents (pay stubs, IDs, lease agreements) directly to Amazon S3, which are automatically linked to their applications in Amazon Aurora, so no one gets dropped at the form. Amazon SNS powers two critical features: proactive renewal reminders sent 30 days before a benefit expires, and a full SMS fallback path for users with limited data or no smartphone, meaning the entire intake and eligibility flow works over text message alone. Together, these features close the gaps that existing tools like mRelief and Benefits.gov leave open — giving people not just an answer to "do I qualify," but a guided path all the way through to applied, tracked, and renewed.


# Competitors 
Direct competitors:

Benefits.gov — official federal portal, but notoriously hard to navigate //
mRelief — SMS/chat-based SNAP screener//
Aunt Bertha / Findhelp.org — large social services directory, used by hospitals and nonprofits //
GetYourBenefits.org — eligibility screener across multiple programs //
BenefitsCal — California's unified benefits portal //
Propel (Fresh EBT) — SNAP balance tracking + benefits discovery, 5M+ users //
Adjacent:

Unite Us / NowPow — used by healthcare systems to connect patients to benefits //
Aidkit — benefits disbursement for nonprofits/government //
