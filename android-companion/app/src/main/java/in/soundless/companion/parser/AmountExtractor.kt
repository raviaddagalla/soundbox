package in.soundless.companion.parser

import java.util.regex.Pattern

object AmountExtractor {

    // Regex matching ₹ followed by either comma-formatted numbers or plain decimal/integer numbers
    private val RUPEE_PATTERN: Pattern = Pattern.compile(
        "₹\\s*([0-9]{1,3}(?:,[0-9]{2,3})+(?:\\.[0-9]{1,2})?|[0-9]+(?:\\.[0-9]{1,2})?)",
        Pattern.CASE_INSENSITIVE
    )

    private val SUFFIX_PATTERN: Pattern = Pattern.compile(
        "\\b([0-9]{1,3}(?:,[0-9]{2,3})+(?:\\.[0-9]{1,2})?|[0-9]+(?:\\.[0-9]{1,2})?)\\s*(?:rupees|rs\\.?|inr)\\b",
        Pattern.CASE_INSENSITIVE
    )

    private val UTR_PATTERN: Pattern = Pattern.compile(
        "(?:UTR|Ref(?:erence)?(?:\\s*no|\\s*id)?|UPI\\s*Ref)[:\\s#]*([A-Za-z0-9]{8,22})",
        Pattern.CASE_INSENSITIVE
    )

    private val PAYER_PATTERN: Pattern = Pattern.compile(
        "(?:received|credited)\\s+.*?from\\s+([A-Za-z0-9\\s.]+?)(?:\\s*(?:\\(UTR|\\(via|\\(UPI|\\(Bank|\\.|/|$))",
        Pattern.CASE_INSENSITIVE
    )

    fun extractAmount(rawText: String?): Double? {
        if (rawText.isNullOrBlank()) return null

        val normalized = rawText
            .replace("[\\u200B-\\u200D\\uFEFF]".toRegex(), "")
            .replace("(\\u20B9|Rs\\.?|INR)".toRegex(RegexOption.IGNORE_CASE), "₹")

        val match = RUPEE_PATTERN.matcher(normalized)
        if (match.find()) {
            val numStr = match.group(1)?.replace(",", "")
            val parsed = numStr?.toDoubleOrNull()
            if (parsed != null && parsed > 0) return parsed
        }

        val suffixMatch = SUFFIX_PATTERN.matcher(rawText)
        if (suffixMatch.find()) {
            val numStr = suffixMatch.group(1)?.replace(",", "")
            val parsed = numStr?.toDoubleOrNull()
            if (parsed != null && parsed > 0) return parsed
        }

        return null
    }

    fun extractReferenceId(rawText: String?): String? {
        if (rawText.isNullOrBlank()) return null
        val match = UTR_PATTERN.matcher(rawText)
        return if (match.find()) match.group(1)?.trim() else null
    }

    fun extractPayerName(rawText: String?): String? {
        if (rawText.isNullOrBlank()) return null
        val match = PAYER_PATTERN.matcher(rawText)
        if (match.find()) {
            val candidate = match.group(1)?.trim()
            if (candidate != null && candidate.length in 2..35 && !candidate.contains("bank", ignoreCase = true)) {
                return candidate
            }
        }
        return null
    }
}
