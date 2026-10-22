import { createSchoolSetup } from "../services/schoolSetup.service";

export const createSchool = async(req, res)=>{
  try {
    const result = await createSchoolSetup(req.body);

    return res.status(201).json({
      success: true,
      data: result
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};