import {
  Transaction,
  RiskLevel,
  TriggeredRule,
  DetectionRuleConfig,
  SystemSettings
} from '../types/index.js';

export interface EvaluationInput {
  amount: number;
  customerId: string;
  merchant: string;
  merchantCategory: string;
  location: {
    city: string;
    country: string;
    ipAddress?: string;
  };
  paymentMethod: string;
  timestamp?: string;
  device?: {
    deviceType?: string;
    fingerprint?: string;
    isVpn?: boolean;
    isNewDevice?: boolean;
  };
  metadata?: {
    failedAttemptsPrior?: number;
    hoursSincePasswordChange?: number;
    historicalAverageAmount?: number;
  };
}

export interface RuleEvaluationResult {
  riskScore: number;
  riskLevel: RiskLevel;
  triggeredRules: TriggeredRule[];
  riskReasons: string[];
  recommendedAction: string;
  suggestedStatus: 'completed' | 'flagged' | 'blocked' | 'under_review';
}

export class FraudDetectionEngine {
  /**
   * Evaluates a transaction against active rules and historical customer context.
   */
  public static evaluate(
    input: EvaluationInput,
    recentCustomerTransactions: Transaction[] = [],
    activeRules: DetectionRuleConfig[] = [],
    settings?: Partial<SystemSettings>
  ): RuleEvaluationResult {
    const triggeredRules: TriggeredRule[] = [];
    const riskReasons: string[] = [];

    // Helper to check if rule is enabled and retrieve its weight
    const getRule = (code: string, defaultWeight: number) => {
      const found = activeRules.find(r => r.code === code);
      if (found) {
        return { isEnabled: found.isEnabled, weight: found.weight, threshold: found.thresholdValue };
      }
      return { isEnabled: true, weight: defaultWeight, threshold: undefined };
    };

    const parsedTime = input.timestamp ? new Date(input.timestamp).getTime() : Date.now();

    // 1. RULE_LARGE_AMOUNT: Amount > $5,000 or > 3.5x customer historical average
    const largeRule = getRule('RULE_LARGE_AMOUNT', 25);
    if (largeRule.isEnabled) {
      const threshold = largeRule.threshold || 5000;
      const historicalAvg = input.metadata?.historicalAverageAmount || 350;
      const isOverThreshold = input.amount >= threshold;
      const isOverBaseline = input.amount > (historicalAvg * 3.5) && input.amount > 1000;

      if (isOverThreshold || isOverBaseline) {
        const score = largeRule.weight;
        const reason = isOverThreshold
          ? `Transaction amount ($${input.amount.toLocaleString()}) exceeds high-value threshold ($${threshold.toLocaleString()}).`
          : `Transaction amount ($${input.amount.toLocaleString()}) is ${(input.amount / historicalAvg).toFixed(1)}x above customer baseline ($${historicalAvg}).`;
        
        triggeredRules.push({
          code: 'RULE_LARGE_AMOUNT',
          name: 'High-Value Outlier',
          description: 'Transaction exceeds configured high-value threshold or customer typical spending.',
          scoreContribution: score,
          reason,
          severity: score >= 30 ? 'high' : 'medium'
        });
        riskReasons.push(reason);
      }
    }

    // 2. RULE_VELOCITY: Multiple transactions in a short window (< 15 mins, >= 3 txns)
    const velocityRule = getRule('RULE_VELOCITY', 30);
    if (velocityRule.isEnabled) {
      const windowMs = 15 * 60 * 1000; // 15 minutes
      const recentWithinWindow = recentCustomerTransactions.filter(tx => {
        const txTime = new Date(tx.timestamp).getTime();
        return Math.abs(parsedTime - txTime) <= windowMs;
      });

      if (recentWithinWindow.length >= 2) { // 2 prior + current = 3
        const count = recentWithinWindow.length + 1;
        triggeredRules.push({
          code: 'RULE_VELOCITY',
          name: 'High-Frequency Velocity Spike',
          description: 'Customer executed rapid-fire transactions within a 15-minute window.',
          scoreContribution: velocityRule.weight,
          reason: `Detected ${count} transactions within 15 minutes for customer ${input.customerId}.`,
          severity: 'high'
        });
        riskReasons.push(`Rapid transaction velocity: ${count} transactions executed within a 15-minute window.`);
      }
    }

    // 3. RULE_FAILED_ATTEMPTS: Failed PIN/CVV or password attempts prior to transaction
    const failedRule = getRule('RULE_FAILED_ATTEMPTS', 25);
    if (failedRule.isEnabled) {
      const failedAttempts = input.metadata?.failedAttemptsPrior ?? 0;
      if (failedAttempts >= 2) {
        triggeredRules.push({
          code: 'RULE_FAILED_ATTEMPTS',
          name: 'Pre-Transaction Authentication Failures',
          description: 'Repeated failed verification or PIN attempts immediately prior to payment.',
          scoreContribution: failedRule.weight,
          reason: `${failedAttempts} failed authentication attempts recorded prior to this transaction.`,
          severity: 'high'
        });
        riskReasons.push(`Prior authentication failures: ${failedAttempts} failed attempts before completion.`);
      }
    }

    // 4. RULE_GEO_ANOMALY: Impossible travel or country hopping
    const geoRule = getRule('RULE_GEO_ANOMALY', 30);
    if (geoRule.isEnabled) {
      // Check against previous transaction location if within 3 hours
      const recentTx = recentCustomerTransactions[0];
      if (recentTx && recentTx.location?.country) {
        const timeDiffHours = Math.abs(parsedTime - new Date(recentTx.timestamp).getTime()) / (1000 * 60 * 60);
        if (timeDiffHours <= 3 && recentTx.location.country !== input.location.country) {
          triggeredRules.push({
            code: 'RULE_GEO_ANOMALY',
            name: 'Impossible Geolocation Travel Speed',
            description: 'Customer location jumped countries faster than commercial air travel speed allows.',
            scoreContribution: geoRule.weight,
            reason: `Jumped from ${recentTx.location.city || recentTx.location.country} to ${input.location.city || input.location.country} in only ${timeDiffHours.toFixed(1)} hours.`,
            severity: 'critical'
          });
          riskReasons.push(`Impossible travel speed detected between ${recentTx.location.country} and ${input.location.country} (${timeDiffHours.toFixed(1)}h elapsed).`);
        }
      }
    }

    // 5. RULE_HIGH_RISK_MERCHANT: Crypto ATM, offshore gambling, anonymous prepaid
    const merchantRule = getRule('RULE_HIGH_RISK_MERCHANT', 20);
    if (merchantRule.isEnabled) {
      const highRiskCategories = ['crypto', 'cryptocurrency', 'gambling', 'casino', 'wire_transfer', 'gift_cards', 'anonymous_wallet'];
      const highRiskTerms = ['crypto', 'bitcoin', 'binance', 'bet365', 'casino', 'western union', 'moneygram', 'pawn', 'darknet', 'voucher'];
      
      const categoryMatch = highRiskCategories.includes((input.merchantCategory || '').toLowerCase());
      const termMatch = highRiskTerms.some(term => (input.merchant || '').toLowerCase().includes(term));

      if (categoryMatch || termMatch) {
        triggeredRules.push({
          code: 'RULE_HIGH_RISK_MERCHANT',
          name: 'High-Risk Merchant Category',
          description: 'Transaction directed to merchant category frequently associated with money laundering or irreversible cash out.',
          scoreContribution: merchantRule.weight,
          reason: `Target merchant "${input.merchant}" falls under monitored risk category "${input.merchantCategory}".`,
          severity: 'medium'
        });
        riskReasons.push(`High-risk merchant class (${input.merchantCategory}): prone to irreversible cash-out or laundering.`);
      }
    }

    // 6. RULE_RECENT_ACCOUNT_CHANGE: Password or 2FA altered < 24h ago with significant amount
    const accountChangeRule = getRule('RULE_RECENT_ACCOUNT_CHANGE', 25);
    if (accountChangeRule.isEnabled) {
      const hoursSinceChange = input.metadata?.hoursSincePasswordChange;
      if (hoursSinceChange !== undefined && hoursSinceChange <= 24 && input.amount >= 1000) {
        triggeredRules.push({
          code: 'RULE_RECENT_ACCOUNT_CHANGE',
          name: 'High-Value Transfer Post-Credential Reset',
          description: 'Account security settings or credentials were changed less than 24 hours prior to a high-value transfer.',
          scoreContribution: accountChangeRule.weight,
          reason: `Security credentials modified ${hoursSinceChange} hour(s) ago; followed by high-value payment ($${input.amount}).`,
          severity: 'high'
        });
        riskReasons.push(`Account takeover warning: Security credentials modified ${hoursSinceChange}h before $${input.amount} payment.`);
      }
    }

    // 7. RULE_STRUCTURING: Smurfing pattern ($9,000 to $9,999)
    const structuringRule = getRule('RULE_STRUCTURING', 20);
    if (structuringRule.isEnabled) {
      if (input.amount >= 9000 && input.amount < 10000) {
        triggeredRules.push({
          code: 'RULE_STRUCTURING',
          name: 'Potential Currency Structuring (Smurfing)',
          description: 'Transaction amount lies just below the mandatory $10,000 CTR reporting threshold.',
          scoreContribution: structuringRule.weight,
          reason: `Amount ($${input.amount.toLocaleString()}) appears structured just beneath the $10,000 threshold.`,
          severity: 'medium'
        });
        riskReasons.push(`Structuring pattern detected: $${input.amount.toLocaleString()} positioned just below $10,000 compliance filing requirement.`);
      }
    }

    // 8. RULE_ANOMALOUS_DEVICE: New device + VPN / Proxy
    const deviceRule = getRule('RULE_ANOMALOUS_DEVICE', 15);
    if (deviceRule.isEnabled) {
      if (input.device?.isVpn && input.device?.isNewDevice) {
        triggeredRules.push({
          code: 'RULE_ANOMALOUS_DEVICE',
          name: 'Unrecognized Device via VPN Proxy',
          description: 'Session originated from an unrecognized device profile routing through commercial VPN/proxy.',
          scoreContribution: deviceRule.weight,
          reason: 'Unregistered device fingerprint connected via anonymizing VPN tunnel.',
          severity: 'low'
        });
        riskReasons.push('Session anomaly: New unrecognized hardware connecting via anonymizing proxy/VPN.');
      }
    }

    // Sum scores, ensure capping at 100
    const rawScore = triggeredRules.reduce((acc, curr) => acc + curr.scoreContribution, 0);
    const riskScore = Math.min(100, Math.max(0, rawScore));

    // Determine Risk Level based on thresholds
    const lowMax = settings?.riskBands?.lowMax ?? 24;
    const medMax = settings?.riskBands?.mediumMax ?? 49;
    const highMax = settings?.riskBands?.highMax ?? 74;

    let riskLevel: RiskLevel = 'low';
    if (riskScore > highMax) {
      riskLevel = 'critical';
    } else if (riskScore > medMax) {
      riskLevel = 'high';
    } else if (riskScore > lowMax) {
      riskLevel = 'medium';
    }

    // Determine Suggested Status & Recommended Action
    let suggestedStatus: 'completed' | 'flagged' | 'blocked' | 'under_review' = 'completed';
    let recommendedAction = 'Approve Transaction: Risk factors within normal operating thresholds.';

    if (riskLevel === 'critical') {
      suggestedStatus = 'blocked';
      recommendedAction = 'Immediate Block & Case Escalation: Multiple severe risk factors triggered. Freeze outgoing transfer and alert senior fraud desk.';
    } else if (riskLevel === 'high') {
      suggestedStatus = 'flagged';
      recommendedAction = 'Hold for Analyst Review: Elevated risk indicators detected. Contact customer for out-of-band verification.';
    } else if (riskLevel === 'medium') {
      suggestedStatus = 'under_review';
      recommendedAction = 'Step-Up Verification: Prompt customer for biometric or secondary MFA confirmation before clearing funds.';
    }

    if (riskReasons.length === 0) {
      riskReasons.push('Transaction exhibits standard behavioral parameters with no anomalous deviations.');
    }

    return {
      riskScore,
      riskLevel,
      triggeredRules,
      riskReasons,
      recommendedAction,
      suggestedStatus
    };
  }
}
