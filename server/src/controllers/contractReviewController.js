import {
  reviewContract
} from "../services/contractReviewService.js";


function normalizeOptionalText(
  value,
  maximumLength
) {
  if (
    typeof value
    !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .slice(
      0,
      maximumLength
    );
}


export async function createContractReview(
  request,
  response
) {
  try {
    const {
      contractTitle,
      contractText
    } =
      request.body;

    if (
      typeof contractText
      !==
      "string"
    ) {
      return response
        .status(400)
        .json({
          success:
            false,

          message:
            "请提交合同文本。"
        });
    }

    const normalizedContractText =
      contractText.trim();

    if (
      normalizedContractText.length
      <
      20
    ) {
      return response
        .status(400)
        .json({
          success:
            false,

          message:
            "合同文本内容过少，请至少输入 20 个字符。"
        });
    }

    if (
      normalizedContractText.length
      >
      50000
    ) {
      return response
        .status(400)
        .json({
          success:
            false,

          message:
            "合同文本内容过长，当前最多支持 50000 个字符。"
        });
    }

    const result =
      await reviewContract({
        contractTitle:
          normalizeOptionalText(
            contractTitle,
            300
          ),

        contractText:
          normalizedContractText
      });

    return response
      .status(201)
      .json({
        success:
          true,

        message:
          "合同审核完成。",

        data:
          result
      });
  } catch (error) {
    console.error(
      "合同审核失败：",
      error
    );

    return response
      .status(500)
      .json({
        success:
          false,

        message:
          "合同审核失败，请稍后重试。"
      });
  }
}
