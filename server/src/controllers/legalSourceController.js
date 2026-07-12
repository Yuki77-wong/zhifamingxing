import {
  getCurrentLegalSources
} from "../services/legalSourceService.js";


export async function listLegalSources(
  request,
  response
) {
  try {
    const legalSources =
      await getCurrentLegalSources();


    return response
      .status(200)
      .json({
        success: true,

        message:
          "官方依据读取成功。",

        data: {
          total:
            legalSources.length,

          items:
            legalSources
        }
      });
  } catch (error) {
    console.error(
      "读取官方依据失败：",
      error
    );


    return response
      .status(500)
      .json({
        success: false,

        message:
          "读取官方依据失败，请稍后重试。"
      });
  }
}