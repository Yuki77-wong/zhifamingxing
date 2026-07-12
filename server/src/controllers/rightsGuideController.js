import {
  getEnabledRightsGuideByCode,
  getEnabledRightsGuides
} from "../services/rightsGuideService.js";


export async function listRightsGuides(
  request,
  response
) {
  try {
    const rightsGuides =
      await getEnabledRightsGuides();


    return response
      .status(200)
      .json({
        success:
          true,

        message:
          "维权指引读取成功。",

        data: {
          total:
            rightsGuides.length,

          items:
            rightsGuides
        }
      });
  } catch (error) {
    console.error(
      "读取维权指引失败：",
      error
    );


    return response
      .status(500)
      .json({
        success:
          false,

        message:
          "读取维权指引失败，请稍后重试。"
      });
  }
}


export async function getRightsGuide(
  request,
  response
) {
  const guideCode =
    String(
      request.params.guideCode
      ||
      ""
    )
      .trim()
      .toUpperCase();


  if (!guideCode) {
    return response
      .status(400)
      .json({
        success:
          false,

        message:
          "请提供维权指引编号。"
      });
  }


  try {
    const rightsGuide =
      await getEnabledRightsGuideByCode(
        guideCode
      );


    if (!rightsGuide) {
      return response
        .status(404)
        .json({
          success:
            false,

          message:
            "未找到对应的维权指引。"
        });
    }


    return response
      .status(200)
      .json({
        success:
          true,

        message:
          "维权指引读取成功。",

        data:
          rightsGuide
      });
  } catch (error) {
    console.error(
      "读取维权指引详情失败：",
      error
    );


    return response
      .status(500)
      .json({
        success:
          false,

        message:
          "读取维权指引失败，请稍后重试。"
      });
  }
}
