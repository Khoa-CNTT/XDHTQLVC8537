const express = require("express");
const router = express.Router();
const {
    getLoaiHH,
    createLoaiHH,
    updateLoaiHH,
    deleteLoaiHH,
    getTinhChatHH,
    createTinhChatHH,
    updateTinhChatHH,
    deleteTinhChatHH,
    getHangHoa,
    createHangHoa,
    updateHangHoa,
    deleteHangHoa,
    getHangHoaByLoai,
    getHangHoaByTinh
} = require("../controllers/controllerHH");

router.get("/loaihh", getLoaiHH);
router.post("/loaihh", createLoaiHH);
router.put("/loaihh/:id", updateLoaiHH);
router.delete("/loaihh/:id", deleteLoaiHH);

router.get("/tinhchathh", getTinhChatHH);
router.post("/tinhchathh", createTinhChatHH);
router.put("/tinhchathh/:id", updateTinhChatHH);
router.delete("/tinhchathh/:id", deleteTinhChatHH);

router.get("/hanghoa", getHangHoa);
router.post("/hanghoa", createHangHoa);
router.put("/hanghoa/:id", updateHangHoa);
router.delete("/hanghoa/:id", deleteHangHoa);

router.get("/hanghoa/loai/:id", getHangHoaByLoai);  // New route for getting HangHoa by LoaiHH
router.get("/hanghoa/tinh/:id", getHangHoaByTinh);  // New route for getting HangHoa by TinhChatHH

module.exports = router;
