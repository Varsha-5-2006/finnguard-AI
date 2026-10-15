import { GoogleGenAI } from '@google/genai';
import { Transaction } from '../types/index.js';

let genAIClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!genAIClient) {
    try {
      genAIClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }
  return genAIClient;
}

export async function generateFraudExplanation(transaction: Transaction): Promise<{
  analysis: string;
  isAiGenerated: boolean;
  modelUsed?: string;
}> {
  const client = getClient();
  if (!client) {
    // High-quality deterministic fallback explanation
    const ruleList = transaction.triggeredRules.map(r => `• ${r.name} (+${r.scoreContribution} pts): ${r.reason}`).join('\n');
    const fallbackText = `**FinGuard Risk Intelligence Assessment (Rule-Engine Summary)**

**Risk Level:** ${transaction.riskLevel.toUpperCase()} (Score: ${transaction.riskScore}/100)
**Transaction:** ${transaction.transactionId} for ${transaction.currency} ${transaction.amount.toLocaleString()} to ${transaction.merchant} (${transaction.merchantCategory})
**Customer:** ${transaction.customerName} (${transaction.customerId}) from ${transaction.location.city}, ${transaction.location.country}

**Key Risk Drivers Identified:**
${ruleList || '• No suspicious behavioral deviation detected against customer baseline.'}

**Investigative Recommendation:**
${transaction.recommendedAction}

*Note: Automated deterministic rule engine assessment active. To enable conversational Gemini AI synthesis, provide a valid GEMINI_API_KEY.*`;

    return {
      analysis: fallbackText,
      isAiGenerated: false,
    };
  }

  try {
    const prompt = `You are a Senior Financial Crime Investigator and Anti-Money Laundering (AML) Compliance Expert.
Analyze the following flagged financial transaction data and generate a clear, professional, executive fraud intelligence brief for a fraud analyst:

Transaction Details:
- Transaction ID: ${transaction.transactionId}
- Amount: ${transaction.currency} ${transaction.amount}
- Customer: ${transaction.customerName} (ID: ${transaction.customerId})
- Merchant: ${transaction.merchant} (Category: ${transaction.merchantCategory})
- Origin: ${transaction.location.city}, ${transaction.location.country}
- Payment Method: ${transaction.paymentMethod}
- Risk Score: ${transaction.riskScore}/100 (${transaction.riskLevel})
- Triggered Rules: ${JSON.stringify(transaction.triggeredRules)}
- Initial Reasons: ${transaction.riskReasons.join('; ')}

Please structure your brief as follows:
1. Executive Incident Summary
2. Modus Operandi & Risk Analysis (explain why these indicators suggest potential fraud or account takeover)
3. Actionable Investigator Playbook (immediate 3 next steps for the compliance team)

Keep it concise, authoritative, and realistic.`;

    // Set a strict 6-second timeout to prevent API calls from hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API call timed out after 6000ms')), 6000);
    });

    const generatePromise = client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are FinGuard AI, an institutional-grade financial fraud intelligence system. Provide objective, clear fraud risk assessments.',
        temperature: 0.3,
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const text = response.text || '';

    return {
      analysis: text,
      isAiGenerated: true,
      modelUsed: 'gemini-3.8-flash',
    };
  } catch (error: any) {
    console.error('Gemini API call failed, falling back to rule summary:', error);
    const fallbackText = `**FinGuard Risk Intelligence Assessment**

**Risk Level:** ${transaction.riskLevel.toUpperCase()} (Score: ${transaction.riskScore}/100)
**Triggered Flags:** ${transaction.triggeredRules.map(r => r.name).join(', ') || 'None'}
**Recommendation:** ${transaction.recommendedAction}

*(AI Service status: ${error?.message || 'Error communicating with Gemini model'}. Fallback rule summary displayed).*`;

    return {
      analysis: fallbackText,
      isAiGenerated: false,
    };
  }
}
