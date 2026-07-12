import {
  reviewJobDescription
} from "../services/jdReviewService.js";


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


export async function createJdReview(
  request,
  response
) {
  try {
    const {
      jobTitle,
      companyName,
      jdText
    } =
      request.body;


    if (
      typeof jdText
      !==
      "string"
    ) {
      return response
        .status(400)
        .json({
          success:
            false,

          message:
            "请提交岗位 JD 文本。"
        });
    }


    const normalizedJdText =
      jdText.trim();


    if (
      normalizedJdText.length
      <
      20
    ) {
      return response
        .status(400)
        .json({
          success:
            false,

          message:
            "岗位 JD 内容过少，"
            +
            "请至少输入 20 个字符。"
        });
    }


    if (
      normalizedJdText.length
      >
      30000
    ) {
      return response
        .status(400)
        .json({
          success:
            false,

          message:
            "岗位 JD 内容过长，"
            +
            "当前最多支持 30000 个字符。"
        });
    }


    const result =
      await reviewJobDescription({
        jobTitle:
          normalizeOptionalText(
            jobTitle,
            300
          ),

        companyName:
          normalizeOptionalText(
            companyName,
            300
          ),

        jdText:
          normalizedJdText
      });


    return response
      .status(201)
      .json({
        success:
          true,

        message:
          "岗位 JD 审查完成。",

        data:
          result
      });
  } catch (error) {
    console.error(
      "JD 审查失败：",
      error
    );


    return response
      .status(500)
      .json({
        success:
          false,

        message:
          "岗位 JD 审查失败，"
          +
          "请稍后重试。"
      });
  }
}