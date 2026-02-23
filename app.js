// ========================================
// CONFIGURATION & GLOBAL VARIABLES
// ========================================
const DEFAULT_HOSPITAL = "Bệnh viện Phụ Sản Hải Phòng";
const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwZBEmHpGq8VQGe3nYdTbbWbVd1o6JY_zF0wg2arRVvwbxwzez54rmvx5acz1V1JBdX/exec";

let APPS_SCRIPT_URL =
  localStorage.getItem("BYT_SCRIPT_URL") || DEFAULT_SCRIPT_URL;
let SESSION_CONFIG = JSON.parse(
  localStorage.getItem("BYT_SESSION_CONFIG") || "null",
);

if (!SESSION_CONFIG || !SESSION_CONFIG.form1) {
  SESSION_CONFIG = {
    form1: { kieu_khao_sat: "", nguoipv: "", nguoi_tra_loi: "" },
    form2: { kieu_khao_sat: "", nguoipv: "", nguoi_tra_loi: "" },
    form3: { kieu_khao_sat: "" },
  };
}

// ========================================
// DATA STRUCTURES
// ========================================

// Footer for Mẫu 1 (Nội trú) - Text matches backend exactly
const form1Footer = [
  {
    id: "G1",
    label:
      "G1. Đánh giá chung, bệnh viện đã đáp ứng được bao nhiêu % so với mong đợi của Ông/Bà trước khi nằm viện? (0-100)",
    mapToHeader:
      "G1. Đánh giá chung, bệnh viện đã đáp ứng được bao nhiêu % so với mong đợi của Ông/Bà trước khi nằm viện?",
    type: "number",
    required: true,
    suffix: "%",
  },
  {
    id: "G2",
    label:
      "G2. Nếu có nhu cầu khám, chữa bệnh, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?",
    mapToHeader:
      "G2. Nếu có nhu cầu khám, chữa bệnh, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?",
    type: "select",
    required: true,
    options: [
      "1. Chắc chắn không bao giờ quay lại",
      "2. Không muốn quay lại nhưng có ít lựa chọn khác",
      "3. Muốn chuyển sang bệnh viện khác",
      "4. Có thể sẽ quay lại",
      "5. Chắc chắn sẽ quay lại hoặc giới thiệu cho người khác",
      "6. Khác",
    ],
  },
  {
    id: "H1",
    label:
      "H1. Đối với các câu hỏi có ý kiến chưa hài lòng, đề nghị Ông/Bà ghi rõ thêm lý do tại sao không hài lòng?",
    mapToHeader:
      "H1. Đối với các câu hỏi có ý kiến chưa hài lòng, đề nghị Ông/Bà ghi rõ thêm lý do tại sao không hài lòng?",
    type: "textarea",
  },
  {
    id: "H2",
    label:
      "H2. Ông/Bà có ý kiến hoặc nhận xét gì khác giúp bệnh viện và hệ thống khám, chữa bệnh phục vụ người bệnh được tốt hơn, xin ghi rõ?",
    mapToHeader:
      "H2. Ông/Bà có ý kiến hoặc nhận xét gì khác giúp bệnh viện và hệ thống khám, chữa bệnh phục vụ người bệnh được tốt hơn, xin ghi rõ?",
    type: "textarea",
  },
];

// Footer for Mẫu 2 (Ngoại trú) - Text matches backend exactly
const form2Footer = [
  {
    id: "G1",
    label:
      "G1. Đánh giá chung, bệnh viện đã đáp ứng được bao nhiêu % so với mong đợi của Ông/Bà trước khi tới khám bệnh? (0-100)",
    mapToHeader:
      "G1. Đánh giá chung bệnh viện đã đáp ứng được bao nhiêu % so với mong đợi trước khi tới khám bệnh?",
    type: "number",
    required: true,
    suffix: "%",
  },
  {
    id: "G2",
    label:
      "G2. Nếu có nhu cầu khám bệnh, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?",
    mapToHeader:
      "G2. Nếu có nhu cầu khám bệnh, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?",
    type: "select",
    required: true,
    options: [
      "1. Chắc chắn không bao giờ quay lại",
      "2. Không muốn quay lại nhưng có ít lựa chọn khác",
      "3. Muốn chuyển sang bệnh viện khác",
      "4. Có thể sẽ quay lại",
      "5. Chắc chắn sẽ quay lại hoặc giới thiệu cho người khác",
      "6. Khác",
    ],
  },
  {
    id: "H1",
    label:
      "H1. Đối với các câu hỏi có ý kiến chưa hài lòng, đề nghị Ông/Bà ghi rõ thêm lý do tại sao không hài lòng?",
    mapToHeader:
      "H1. Đối với các câu hỏi có ý kiến chưa hài lòng, đề nghị Ông/Bà ghi rõ thêm lý do tại sao không hài lòng",
    type: "textarea",
  },
  {
    id: "H2",
    label:
      "H2. Ông/Bà có ý kiến hoặc nhận xét gì khác giúp bệnh viện và hệ thống khám, chữa bệnh phục vụ người bệnh được tốt hơn, xin ghi rõ?",
    mapToHeader:
      "H2. Ông/Bà có ý kiến hoặc nhận xét gì khác giúp bệnh viện và hệ thống khám, chữa bệnh phục vụ người bệnh tốt hơn?",
    type: "textarea",
  },
];

// Mẫu 1: Nội trú
const form1Structure = {
  id: "form1",
  title: "Nội Trú (Mẫu 01)",
  demographics: [
    {
      id: "kieu_khao_sat",
      label: "Kiểu khảo sát",
      type: "select",
      options: [
        "1. Bệnh viện tự đánh giá hàng tháng/quý",
        "2. Bệnh viện tự đánh giá cuối năm",
        "3. Do đoàn Bộ Y tế/Sở Y tế thực hiện",
        "4. Do đoàn phúc tra của BYT thực hiện",
        "5. Do đoàn kiểm tra chéo",
        "6. Hình thức khác",
      ],
      required: true,
      width: "full",
    },
    {
      id: "nguoipv",
      label: "Người phỏng vấn/điền phiếu",
      type: "select",
      options: [
        "a. Người bệnh tự điền (hoặc người nhà)",
        "b. Nhân viên của bệnh viện",
        "c. Bộ Y tế, Sở Y tế hoặc các đoàn giám sát của cơ quan quản lý",
        "d. Tổ chức độc lập",
        "e. Đối tượng khác, ghi rõ…",
      ],
      required: true,
      width: "full",
    },
    {
      id: "nguoi_tra_loi",
      label: "Người trả lời",
      type: "select",
      options: ["a. Người bệnh", "b. Người nhà"],
      required: true,
      width: "half",
    },
    {
      id: "a1_gender",
      label: "A1. Giới tính",
      mapToHeader: "Giới tính",
      type: "radio",
      options: ["1. Nam", "2. Nữ", "3. Khác"],
      required: true,
      width: "half",
    },
    {
      id: "a2_age",
      label: "A2. Tuổi hoặc năm sinh",
      mapToHeader: "Tuổi hoặc năm sinh",
      type: "number",
      required: true,
      width: "half",
    },
    {
      id: "a3_phone",
      label: "A3. Số di động",
      mapToHeader: "Số di động",
      type: "tel",
      required: false,
      width: "half",
    },
    {
      id: "a4_days",
      label: "A4. Số ngày nằm viện",
      mapToHeader: "Số ngày nằm viện",
      type: "number",
      required: true,
      width: "half",
    },
    {
      id: "a5_bhyt",
      label: "A5. Ông/Bà có sử dụng thẻ BHYT cho lần điều trị này không?",
      mapToHeader: "Ông/Bà có sử dụng thẻ BHYT cho lần điều trị này không?",
      type: "radio",
      options: ["1. Có", "2. Không"],
      required: true,
      width: "full",
    },
    {
      id: "a6_place",
      label: "A6. Nơi sinh sống hiện nay",
      mapToHeader: "Nơi sinh sống hiện nay",
      type: "select",
      options: ["1. Thành thị", "2. Nông thôn", "3. Vùng sâu, xa khó khăn"],
      required: true,
      width: "half",
    },
    {
      id: "a7_economy",
      label: "A7. Phân loại mức sống của gia đình",
      mapToHeader: "Phân loại mức sống của gia đình",
      type: "select",
      options: ["1. Nghèo", "2. Cận nghèo", "3. Khác"],
      required: true,
      width: "half",
    },
    {
      id: "a8_times",
      label:
        "A8. Đây là lần điều trị thứ mấy của Ông/Bà tại bệnh viện? Lần thứ:",
      mapToHeader:
        "Đây là lần điều trị thứ mấy của Ông/Bà tại bệnh viện? (Lần thứ:)",
      type: "number",
      required: true,
      width: "full",
    },
  ],
  sections: [
    {
      title: "A. Khả năng tiếp cận",
      questions: [
        {
          id: "S_A1",
          text: "Việc di chuyển, tìm kiếm thông tin và được nhân viên hướng dẫn trong bệnh viện thuận tiện, dễ dàng.",
          required: true,
          mapToHeaders: [
            "A1. Các sơ đồ, biển báo chỉ dẫn đường đến các khoa, phòng và thông báo giờ khám, chữa bệnh, giờ vào thăm rõ ràng, dễ hiểu",
            "A2. Các tòa nhà, cầu thang bộ, thang máy, buồng bệnh được đánh số và hướng dẫn rõ ràng, dễ tìm",
            "A3. Các lối đi trong bệnh viện, hành lang bằng phẳng, an toàn, dễ đi",
            "A5. Người bệnh hỏi và gọi được nhân viên y tế khi cần thiết",
          ],
        },
        {
          id: "S_A2",
          text: "Thời gian chờ đợi khám chữa bệnh chấp nhận được",
          required: true,
          mapToHeaders: [
            "A4. Thời gian chờ đợi thang máy, làm thủ tục và chờ đợi trong quá trình khám, chữa bệnh chấp nhận được",
          ],
        },
      ],
    },
    {
      title: "B. Sự minh bạch thông tin",
      questions: [
        {
          id: "S_B1",
          text: "Ông/Bà được hướng dẫn đầy đủ, rõ ràng về: quy trình khám chữa bệnh, nội quy nhập viện, thông tin điều trị",
          required: true,
          mapToHeaders: [
            "B1. Quy trình, thủ tục hành chính (nhập, xuất viện, chuyển viện, chuyển khoa…) rõ ràng, công khai, thuận tiện",
            "B3. Quy trình, thời gian làm thủ tục thanh toán viện phí khi ra viện rõ ràng, công khai, thuận tiện",
            "B4. Được phổ biến về nội quy và những thông tin cần thiết khi nằm viện rõ ràng, đầy đủ",
            "B5. Được giải thích về tình trạng bệnh, phương pháp và thời gian dự kiến điều trị rõ ràng, đầy đủ",
            "B6. Được giải thích, tư vấn trước khi yêu cầu làm các xét nghiệm, thăm dò, kỹ thuật cao rõ ràng, đầy đủ",
          ],
        },
        {
          id: "S_B2",
          text: "Thông tin về thuốc và chi phí điều trị được công khai, rõ ràng và cập nhật.",
          required: true,
          mapToHeaders: [
            "B2. Giá dịch vụ y tế được niêm yết, thông báo công khai ở vị trí dễ quan sát, dễ đọc, dễ hiểu và được tư vấn, giải thích các chi phí cao nếu có",
            "B7. Được công khai và cập nhật thông tin về dùng thuốc và chi phí điều trị",
          ],
        },
      ],
    },
    {
      title: "C. Cơ sở vật chất",
      questions: [
        {
          id: "S_C1",
          text: "Cơ sở vật chất trong phòng bệnh (giường nằm, quạt/điều hòa, nhà vệ sinh, nước uống, quần áo…) sạch sẽ, đầy đủ và thuận tiện sử dụng",
          required: true,
          mapToHeaders: [
            "C1. Buồng bệnh khang trang, sạch sẽ, có đầy đủ các thiết bị điều chỉnh nhiệt độ phù hợp như quạt, máy sưởi, hoặc điều hòa",
            "C3. Giường bệnh, ga, gối đầy đủ cho mỗi người một giường, chắc chắn, sử dụng tốt",
            "C4. Được cung cấp quần áo đầy đủ, sạch sẽ",
            "C5. Nhà vệ sinh, nhà tắm thuận tiện, sạch sẽ, sử dụng tốt",
            "C6. Được cung cấp đầy đủ nước uống nóng, lạnh ngay tại khoa điều trị",
            "C7. Người bệnh và người nhà người bệnh truy cập được mạng internet không dây (wifi) ngay tại buồng bệnh",
            "C11. Được cung cấp phương tiện vận chuyển nội viện như xe lăn, cáng, xe điện đầy đủ, kịp thời, sử dụng tốt khi có nhu cầu",
          ],
        },
        {
          id: "S_C2",
          text: "Đảm bảo sự riêng tư, an toàn cho người bệnh (rèm che, vách ngăn, an ninh, …)",
          required: true,
          mapToHeaders: [
            "C2. Buồng bệnh yên tĩnh, bảo đảm an toàn, an ninh, trật tự, phòng ngừa trộm cắp, yên tâm khi nằm viện",
            "C8. Được bảo đảm sự riêng tư khi nằm viện như thay quần áo, khám bệnh, đi vệ sinh tại giường… có rèm che, vách ngăn hoặc nằm riêng",
          ],
        },
        {
          id: "S_C3",
          text: "Môi trường sinh hoạt (Khuôn viên bệnh viện và khu căng-tin) sạch sẽ, thuận tiện và đáp ứng tốt nhu cầu sinh hoạt của người bệnh",
          required: true,
          mapToHeaders: [
            "C9. Căng-tin bệnh viện phục vụ ăn uống và nhu cầu sinh hoạt thiết yếu đầy đủ và chất lượng",
            "C10. Môi trường trong khuôn viên bệnh viện xanh, sạch, đẹp",
          ],
        },
      ],
    },
    {
      title: "D. Thái độ NVYT",
      questions: [
        {
          id: "S_D1",
          text: "Nhân viên y tế có thái độ giao tiếp đúng mực, tôn trọng, công bằng, không gợi ý bồi dưỡng.",
          required: true,
          mapToHeaders: [
            "D1. Bác sỹ, điều dưỡng có lời nói, thái độ, giao tiếp đúng mực",
            "D2. Nhân viên phục vụ (hộ lý, bảo vệ, kế toán…) có lời nói, thái độ, giao tiếp đúng mực",
            "D3. Được nhân viên y tế tôn trọng, đối xử công bằng, quan tâm, giúp đỡ",
            "D7. Không bị nhân viên y tế gợi ý bồi dưỡng",
          ],
        },
        {
          id: "S_D2",
          text: "Bác sĩ và điều dưỡng thăm khám, chăm sóc, tư vấn rõ ràng và kịp thời.",
          required: true,
          mapToHeaders: [
            "D4. Bác sỹ, điều dưỡng hợp tác tốt và xử lý công việc thành thạo, kịp thời",
            "D5. Được bác sỹ thăm khám, động viên tại phòng điều trị",
            "D6. Được tư vấn chế độ ăn, vận động, theo dõi và phòng ngừa biến chứng",
          ],
        },
      ],
    },
    {
      title: "E. Kết quả",
      questions: [
        {
          id: "S_E1",
          text: "Kết quả điều trị, trang thiết bị và thuốc đáp ứng mong đợi.",
          required: true,
          mapToHeaders: [
            "E1. Thời gian chờ đợi khi khám, chữa bệnh tại bệnh viện",
            "E2. Được cấp phát cho dùng thuốc đúng giờ, hướng dẫn sử dụng thuốc đầy đủ và các tác dụng phụ nếu có",
            "E3. Được nhắc lịch tái khám và hướng dẫn thực hành ăn uống, luyện tập, chăm sóc tại nhà trước khi ra viện",
            "E4. Trang thiết bị, vật tư y tế đầy đủ, hiện đại, đáp ứng nhu cầu khám chữa bệnh",
            "E5. Kết quả điều trị đáp ứng được nguyện vọng",
          ],
        },
        {
          id: "S_E2",
          text: "Ông/Bà tin tưởng về chất lượng dịch vụ y tế.",
          required: true,
          mapToHeaders: [
            "E6. Ông/Bà đánh giá mức độ tin tưởng về chất lượng dịch vụ y tế",
          ],
        },
        {
          id: "S_E3",
          text: "Ông/Bà cho nhận xét về số tiền chi trả có tương xứng với chất lượng dịch vụ y tế không?",
          required: true,
          isCost: true,
          mapToHeaders: [
            "E7. Ông/Bà cho nhận xét về số tiền chi trả có tương xứng với chất lượng dịch vụ y tế không?",
          ],
        },
      ],
    },
  ],
  footer: form1Footer,
};

// Mẫu 2: Ngoại trú
const form2Structure = {
  id: "form2",
  title: "Ngoại Trú (Mẫu 02)",
  demographics: [
    {
      id: "kieu_khao_sat",
      label: "Kiểu khảo sát",
      type: "select",
      options: [
        "1. Bệnh viện tự đánh giá hàng tháng/quý",
        "2. Bệnh viện tự đánh giá cuối năm",
        "3. Do đoàn Bộ Y tế/Sở Y tế thực hiện",
        "4. Do đoàn phúc tra của BYT thực hiện",
        "5. Do đoàn kiểm tra chéo",
        "6. Hình thức khác",
      ],
      required: true,
      width: "full",
    },
    {
      id: "nguoipv",
      label: "Người phỏng vấn/điền phiếu",
      type: "select",
      options: [
        "a. Người bệnh tự điền (hoặc người nhà)",
        "b. Nhân viên của bệnh viện",
        "c. Bộ Y tế, Sở Y tế hoặc các đoàn giám sát của cơ quan quản lý",
        "d. Tổ chức độc lập",
        "e. Đối tượng khác, ghi rõ…",
      ],
      required: true,
      width: "full",
    },
    {
      id: "nguoi_tra_loi",
      label: "Người trả lời",
      type: "select",
      options: ["a. Người bệnh", "b. Người nhà"],
      required: true,
      width: "half",
    },
    {
      id: "a1_gender",
      label: "A1. Giới tính",
      mapToHeader: "Giới tính",
      type: "radio",
      options: ["1. Nam", "2. Nữ", "3. Khác"],
      required: true,
      width: "half",
    },
    {
      id: "a2_age",
      label: "A2. Tuổi hoặc năm sinh",
      mapToHeader: "Tuổi hoặc năm sinh",
      type: "number",
      required: true,
      width: "half",
    },
    {
      id: "a3_phone",
      label: "A3. Số di động",
      mapToHeader: "Số di động",
      type: "tel",
      required: false,
      width: "half",
    },
    {
      id: "a4_distance",
      label: "A4. Ước tính khoảng cách từ nơi sinh sống đến bệnh viện (km)",
      mapToHeader: "Ước tính khoảng cách từ nơi sinh sống đến bệnh viện",
      type: "number",
      required: true,
      width: "half",
    },
    {
      id: "a5_bhyt",
      label: "A5. Ông/Bà có sử dụng thẻ BHYT cho lần khám bệnh này không?",
      mapToHeader: "Ông/Bà có sử dụng thẻ BHYT cho lần khám bệnh này không?",
      type: "radio",
      options: ["1. Có", "2. Không"],
      required: true,
      width: "full",
    },
    {
      id: "a6_place",
      label: "A6. Nơi sinh sống hiện nay",
      mapToHeader: "Nơi sinh sống hiện nay",
      type: "select",
      options: ["1. Thành thị", "2. Nông thôn", "3. Vùng sâu, xa khó khăn"],
      required: true,
      width: "half",
    },
    {
      id: "a7_economy",
      label: "A7. Phân loại mức sống của gia đình",
      mapToHeader: "Phân loại mức sống của gia đình",
      type: "select",
      options: ["1. Nghèo", "2. Cận nghèo", "3. Khác"],
      required: true,
      width: "half",
    },
    {
      id: "a8_times",
      label:
        "A8. Đây là lần điều trị thứ mấy của Ông/Bà tại bệnh viện? Lần thứ:",
      mapToHeader:
        "Đây là lần điều trị thứ mấy của Ông/Bà tại bệnh viện? (Lần thứ:)",
      type: "number",
      required: true,
      width: "full",
    },
  ],
  sections: [
    {
      title: "A. Khả năng tiếp cận",
      questions: [
        {
          id: "S_A1",
          text: "Biển báo, sơ đồ, lối đi và các kênh đăng ký khám (trực tiếp/điện thoại/website) rõ ràng, dễ tìm, thuận tiện.",
          required: true,
          mapToHeaders: [
            "A1. Các biển báo, chỉ dẫn đường đến bệnh viện rõ ràng, dễ nhìn, dễ tìm",
            "A2. Các sơ đồ, biển báo chỉ dẫn đường đến các khoa, phòng trong bệnh viện rõ ràng, dễ hiểu, dễ tìm",
            "A3. Các khối nhà, cầu thang được đánh số rõ ràng, dễ tìm",
            "A4. Các lối đi trong bệnh viện, hành lang bằng phẳng, dễ đi",
            "A5. Có thể tìm hiểu thông tin và đăng ký khám qua điện thoại, website của bệnh viện thuận tiện",
          ],
        },
      ],
    },
    {
      title: "B. Minh bạch & Thủ tục",
      questions: [
        {
          id: "S_B1",
          text: "Quy trình khám bệnh, thủ tục và giá dịch vụ được niêm yết rõ ràng, công khai, dễ hiểu.",
          required: true,
          mapToHeaders: [
            "B1. Quy trình khám bệnh được niêm yết rõ ràng, công khai, dễ hiểu",
            "B2. Các quy trình, thủ tục khám bệnh được cải cách đơn giản, thuận tiện",
            "B3. Giá dịch vụ y tế niêm yết rõ ràng, công khai",
          ],
        },
        {
          id: "S_B2",
          text: "Nhân viên y tế tiếp đón, hướng dẫn tận tình và người bệnh được xếp thứ tự công bằng khi làm thủ tục.",
          required: true,
          mapToHeaders: [
            "B4. Nhân viên y tế tiếp đón, hướng dẫn người bệnh làm các thủ tục niềm nở, tận tình",
            "B5. Được xếp hàng theo thứ tự trước sau khi làm các thủ tục đăng ký, nộp tiền, khám bệnh, xét nghiệm, chiếu chụp",
          ],
        },
        {
          id: "S_B3",
          text: "Đánh giá thời gian chờ đợi khám chữa bệnh.",
          required: true,
          mapToHeaders: [
            "B6. Đánh giá thời gian chờ đợi làm thủ tục đăng ký khám",
            "B7. Đánh giá thời gian chờ tới lượt bác sỹ khám",
            "B8. Đánh giá thời gian được bác sỹ khám và tư vấn",
            "B9. Đánh giá thời gian chờ làm xét nghiệm, chiếu chụp",
            "B10. Đánh giá thời gian chờ nhận kết quả xét nghiệm, chiếu chụp",
          ],
        },
      ],
    },
    {
      title: "C. Cơ sở vật chất",
      questions: [
        {
          id: "S_C1",
          text: "Cơ sở vật chất phòng chờ (ghế ngồi, quạt/điều hòa, nhà vệ sinh, TV, tranh ảnh, tờ rơi, nước uống…) sạch sẽ, đầy đủ và thuận tiện sử dụng.",
          required: true,
          mapToHeaders: [
            "C1. Có phòng/sảnh chờ khám sạch sẽ, thoáng mát mùa hè; kín gió và ấm áp mùa đông",
            "C2. Phòng chờ có đủ ghế ngồi cho người bệnh và sử dụng tốt",
            "C3. Phòng chờ có quạt (điều hòa) đầy đủ, hoạt động thường xuyên",
            "C4. Phòng chờ có các phương tiện giúp người bệnh thoải mái như ti-vi, tranh ảnh, tờ rơi, nước uống...",
            "C6. Nhà vệ sinh thuận tiện, sử dụng tốt, sạch sẽ",
          ],
        },
        {
          id: "S_C2",
          text: "Đảm bảo sự riêng tư, an toàn cho người bệnh (rèm che, vách ngăn, an ninh,…).",
          required: true,
          mapToHeaders: [
            "C5. Được bảo đảm sự riêng tư khi khám bệnh, chiếu chụp, làm thủ thuật",
            "C8. Khu khám bệnh bảo đảm an ninh, trật tự, phòng ngừa trộm cắp cho người dân",
          ],
        },
        {
          id: "S_C3",
          text: "Môi trường trong khuôn viên bệnh viện xanh, sạch, đẹp.",
          required: true,
          mapToHeaders: [
            "C7. Môi trường trong khuôn viên bệnh viện xanh, sạch, đẹp",
          ],
        },
      ],
    },
    {
      title: "D. Thái độ NVYT",
      questions: [
        {
          id: "S_D1",
          text: "Nhân viên y tế và nhân viên phục vụ có thái độ giao tiếp đúng mực, tôn trọng và công bằng.",
          required: true,
          mapToHeaders: [
            "D1. Nhân viên y tế (bác sỹ, điều dưỡng) có lời nói, thái độ, giao tiếp đúng mực",
            "D2. Nhân viên phục vụ (hộ lý, bảo vệ, kế toán…) có lời nói, thái độ, giao tiếp đúng mực",
            "D3. Được nhân viên y tế tôn trọng, đối xử công bằng, quan tâm, giúp đỡ",
          ],
        },
        {
          id: "S_D2",
          text: "Năng lực chuyên môn của bác sỹ, điều dưỡng đáp ứng mong đợi.",
          required: true,
          mapToHeaders: [
            "D4. Năng lực chuyên môn của bác sỹ, điều dưỡng đáp ứng mong đợi",
          ],
        },
      ],
    },
    {
      title: "E. Kết quả",
      questions: [
        {
          id: "S_E1",
          text: "Kết quả khám bệnh, hồ sơ, đơn thuốc và giải thích của nhân viên y tế rõ ràng, đầy đủ.",
          required: true,
          mapToHeaders: [
            "E1. Kết quả khám bệnh đáp ứng được nguyện vọng của Ông/Bà",
            "E2. Hóa đơn, phiếu thu, đơn thuốc và kết quả khám được cung cấp đầy đủ, rõ ràng, minh bạch và được giải thích khi có thắc mắc",
          ],
        },
        {
          id: "S_E2",
          text: "Mức độ tin tưởng và hài lòng chung của Ông/Bà đối với chất lượng và giá dịch vụ y tế.",
          required: true,
          mapToHeaders: [
            "E3. Đánh giá mức độ tin tưởng về chất lượng dịch vụ y tế",
            "E4. Đánh giá mức độ hài lòng về giá cả dịch vụ y tế",
          ],
        },
        {
          id: "S_E3",
          text: "Ông/Bà cho nhận xét về số tiền chi trả có tương xứng với chất lượng dịch vụ y tế không?",
          required: true,
          isCost: true,
          mapToHeaders: [
            "E5. Nhận xét về số tiền chi trả có tương xứng với chất lượng dịch vụ y tế không?",
          ],
        },
      ],
    },
  ],
  footer: form2Footer,
};

// Mẫu 3: Nhân viên
const form3Structure = {
  id: "form3",
  title: "Nhân Viên (Mẫu 03)",
  demographics: [
    {
      id: "kieu_khao_sat",
      label: "Kiểu khảo sát",
      type: "select",
      options: [
        "1. Bệnh viện tự đánh giá hàng tháng/quý",
        "2. Bệnh viện tự đánh giá cuối năm",
        "3. Do đoàn Bộ Y tế/Sở Y tế thực hiện",
        "4. Do đoàn phúc tra của BYT thực hiện",
        "5. Do đoàn kiểm tra chéo",
        "6. Hình thức khác",
      ],
      required: true,
      width: "full",
    },
    {
      id: "a1_gender",
      label: "A1. Giới tính",
      mapToHeader: "Giới tính",
      type: "radio",
      options: ["1. Nam", "2. Nữ", "3. Khác"],
      required: true,
      width: "half",
    },
    {
      id: "a2_age",
      label: "A2. Tuổi",
      mapToHeader: "Tuổi",
      type: "number",
      required: true,
      width: "half",
    },
    {
      id: "a3_job",
      label: "A3. Chuyên môn đào tạo chính",
      mapToHeader: "Chuyên môn đào tạo chính",
      type: "select",
      options: [
        "1. Bác sỹ",
        "2. Dược sỹ",
        "3. Điều dưỡng, hộ sinh",
        "4. Kỹ thuật viên",
        "5. Khác",
      ],
      required: true,
      width: "full",
    },
    {
      id: "a4_degree",
      label: "A4. Bằng cấp cao nhất của Ông/Bà",
      mapToHeader: "Bằng cấp cao nhất của Ông/Bà",
      type: "select",
      options: [
        "1. Trung cấp",
        "2. Cao đẳng",
        "3. Đại học",
        "4. Cao học, CKI",
        "5. Tiến sỹ, CKII",
        "6. Khác",
      ],
      required: true,
      width: "half",
    },
    {
      id: "a5_exp_y",
      label: "A5. Số năm công tác trong ngành Y",
      mapToHeader: "Số năm công tác trong ngành Y",
      type: "number",
      required: true,
      width: "half",
    },
    {
      id: "a6_exp_bv",
      label: "A6. Số năm công tác tại bệnh viện hiện nay",
      mapToHeader: "Số năm công tác tại bệnh viện hiện nay",
      type: "number",
      required: true,
      width: "half",
    },
    {
      id: "a7_pos",
      label: "A7. Vị trí công tác hiện tại",
      mapToHeader: "Vị trí công tác hiện tại",
      type: "select",
      options: [
        "1. Lãnh đạo bệnh viện",
        "2. Trưởng khoa/phòng/ trung tâm",
        "3. Phó khoa/phòng",
        "4. Điều dưỡng/Hộ sinh/KTV trưởng",
        "5. NV biên chế/hợp đồng dài hạn",
        "6. Hợp đồng ngắn hạn",
        "7. Khác",
      ],
      required: true,
      width: "half",
    },
    {
      id: "a8_scope",
      label: "A8. Phạm vi hoạt động chuyên môn",
      mapToHeader: "Phạm vi hoạt động chuyên môn",
      type: "select",
      options: [
        "1. Khối hành chính",
        "2. Cận lâm sàng",
        "3. Nội",
        "4. Ngoại",
        "5. Sản",
        "6. Nhi",
        "7. Truyền nhiễm",
        "8. Chuyên khoa lẻ (mắt, TMH, RHM…)",
        "9. Các khoa không trực tiếp KCB",
        "10. Dược",
        "11. Dự phòng",
        "12. Khác",
      ],
      required: true,
      width: "full",
    },
    {
      id: "a9_multi",
      label: "A9. Anh/Chị có được phân công kiêm nhiệm nhiều công việc không?",
      mapToHeader:
        "Anh/Chị có được phân công kiêm nhiệm nhiều công việc không?",
      type: "radio",
      options: [
        "1. Không kiêm nhiệm",
        "2. Kiêm nhiệm 2 công việc",
        "3. Kiêm nhiệm từ 3 công việc trở lên",
      ],
      required: true,
      width: "half",
    },
    {
      id: "a10_shift",
      label: "A10. Trung bình Anh/Chị trực mấy lần trong một tháng?",
      mapToHeader: "Trung bình Anh/Chị trực mấy lần trong một tháng?",
      type: "number",
      required: true,
      width: "half",
    },
  ],
  sections: [
    {
      title: "A. Sự hài lòng về môi trường làm việc",
      questions: [
        {
          id: "A1",
          text: "A1. Phòng làm việc khang trang, sạch sẽ, thoáng mát",
          required: true,
          mapToHeaders: ["A1. Phòng làm việc khang trang, sạch sẽ, thoáng mát"],
        },
        {
          id: "A2",
          text: "A2. Trang thiết bị văn phòng, bàn ghế làm việc... đầy đủ, các thiết bị cũ, lạc hậu được thay thế kịp thời",
          required: true,
          mapToHeaders: [
            "A2. Trang thiết bị văn phòng, bàn ghế làm việc đầy đủ; các thiết bị cũ, lạc hậu được thay thế kịp thời",
          ],
        },
        {
          id: "A3",
          text: "A3. Có bố trí phòng trực cho NVYT",
          required: true,
          mapToHeaders: ["A3. Có bố trí phòng trực cho NVYT"],
        },
        {
          id: "A4",
          text: "A4. Phân chia thời gian trực và làm việc ngoài giờ hành chính hợp lý",
          required: true,
          mapToHeaders: [
            "A4. Phân chia thời gian trực và làm việc ngoài giờ hành chính hợp lý",
          ],
        },
        {
          id: "A5",
          text: "A5. Các trang bị bảo hộ cho NVYT (quần áo, khẩu trang, găng tay..) đầy đủ, không bị cũ, nhàu nát, không bị hạn chế sử dụng",
          required: true,
          mapToHeaders: [
            "A5. Các trang bị bảo hộ cho NVYT (quần áo, khẩu trang, găng tay..) đầy đủ, không bị cũ, nhàu nát, không bị hạn chế sử dụng",
          ],
        },
        {
          id: "A6",
          text: "A6. Môi trường học tập tạo điều kiện cho NVYT cập nhật kiến thức, nâng cao trình độ: thư viện, phòng đọc, tra cứu thông tin, truy cập internet...",
          required: true,
          mapToHeaders: [
            "A6. Môi trường học tập tạo điều kiện cho NVYT cập nhật kiến thức, nâng cao trình độ: thư viện, phòng đọc, tra cứu thông tin, truy cập internet...",
          ],
        },
        {
          id: "A7",
          text: "A7. Môi trường làm việc bảo đảm an toàn cho NVYT",
          required: true,
          mapToHeaders: ["A7. Môi trường làm việc bảo đảm an toàn cho NVYT"],
        },
        {
          id: "A8",
          text: "A8. Bệnh viện bảo đảm an ninh, trật tự cho NVYT làm việc",
          required: true,
          mapToHeaders: [
            "A8. Bệnh viện bảo đảm an ninh, trật tự cho NVYT làm việc",
          ],
        },
        {
          id: "A9",
          text: "A9. Người bệnh và người nhà có thái độ tôn trọng, hợp tác với NVYT trong quá trình điều trị",
          required: true,
          mapToHeaders: [
            "A9. Người bệnh và người nhà có thái độ tôn trọng, hợp tác với NVYT trong quá trình điều trị",
          ],
        },
      ],
    },
    {
      title: "B. Sự hài lòng về lãnh đạo trực tiếp, đồng nghiệp",
      questions: [
        {
          id: "B1",
          text: "B1. Lãnh đạo có năng lực xử lý, điều hành, giải quyết công việc hiệu quả",
          required: true,
          mapToHeaders: ["B1. Lãnh đạo có năng lực xử lý, điều hành"],
        },
        {
          id: "B2",
          text: "B2. Lãnh đạo phân công công việc phù hợp với chuyên môn đào tạo của nhân viên",
          required: true,
          mapToHeaders: [
            "B2. Lãnh đạo phân công công việc phù hợp với chuyên môn đào tạo của nhân viên",
          ],
        },
        {
          id: "B3",
          text: "B3. Lãnh đạo quan tâm, tôn trọng, đối xử bình đẳng với các NVYT",
          required: true,
          mapToHeaders: [
            "B3. Lãnh đạo quan tâm, tôn trọng, đối xử bình đẳng với các NVYT",
          ],
        },
        {
          id: "B4",
          text: "B4. Lãnh đạo lắng nghe và tiếp thu ý kiến đóng góp NVYT",
          required: true,
          mapToHeaders: [
            "B4. Lãnh đạo lắng nghe và tiếp thu ý kiến đóng góp của NVYT",
          ],
        },
        {
          id: "B5",
          text: "B5. Lãnh đạo động viên, khích lệ nhân viên khi hoàn thành tốt nhiệm vụ, có tiến bộ trong công việc",
          required: true,
          mapToHeaders: [
            "B5. Lãnh đạo động viên, khích lệ nhân viên khi hoàn thành tốt nhiệm vụ, có tiến bộ trong công việc",
          ],
        },
        {
          id: "B6",
          text: "B6. Đồng nghiệp có ý thức hợp tác để hoàn thành nhiệm vụ chung",
          required: true,
          mapToHeaders: [
            "B6. Đồng nghiệp có ý thức hợp tác để hoàn thành nhiệm vụ chung",
          ],
        },
        {
          id: "B7",
          text: "B7. Môi trường làm việc thân thiện, đoàn kết",
          required: true,
          mapToHeaders: ["B7. Môi trường làm việc thân thiện, đoàn kết"],
        },
        {
          id: "B8",
          text: "B8. Đồng nghiệp chia sẻ kinh nghiệm, giúp đỡ nhau trong công việc",
          required: true,
          mapToHeaders: [
            "B8. Đồng nghiệp chia sẻ kinh nghiệm, giúp đỡ nhau trong công việc",
          ],
        },
        {
          id: "B9",
          text: "B9. Đồng nghiệp quan tâm, giúp đỡ nhau trong cuộc sống",
          required: true,
          mapToHeaders: [
            "B9. Đồng nghiệp quan tâm, giúp đỡ nhau trong cuộc sống",
          ],
        },
      ],
    },
    {
      title: "C. Sự hài lòng về quy chế nội bộ, tiền lương, phúc lợi",
      questions: [
        {
          id: "C1",
          text: "C1. Các quy định, quy chế làm việc nội bộ của bệnh viện rõ ràng, thực tế và công khai",
          required: true,
          mapToHeaders: [
            "C1. Các quy định, quy chế làm việc nội bộ của bệnh viện rõ ràng, thực tế và công khai",
          ],
        },
        {
          id: "C2",
          text: "C2. Môi trường làm việc tại khoa/phòng và bệnh viện dân chủ",
          required: true,
          mapToHeaders: [
            "C2. Môi trường làm việc tại khoa/phòng và bệnh viện dân chủ",
          ],
        },
        {
          id: "C3",
          text: "C3. Quy chế chi tiêu nội bộ công bằng, hợp lý, công khai",
          required: true,
          mapToHeaders: [
            "C3. Quy chế chi tiêu nội bộ công bằng, hợp lý, công khai",
          ],
        },
        {
          id: "C4",
          text: "C4. Việc phân phối quỹ phúc lợi công bằng, công khai",
          required: true,
          mapToHeaders: [
            "C4. Việc phân phối quỹ phúc lợi công bằng, công khai",
          ],
        },
        {
          id: "C5",
          text: "C5. Mức lương tương xứng so với năng lực và cống hiến",
          required: true,
          mapToHeaders: [
            "C5. Mức lương tương xứng so với năng lực và cống hiến",
          ],
        },
        {
          id: "C6",
          text: "C6. Chế độ phụ cấp nghề và độc hại xứng đáng so với cống hiến",
          required: true,
          mapToHeaders: [
            "C6. Chế độ phụ cấp nghề và độc hại xứng đáng so với cống hiến",
          ],
        },
        {
          id: "C7",
          text: "C7. Thưởng và thu nhập tăng thêm ABC xứng đáng so với cống hiến",
          required: true,
          mapToHeaders: [
            "C7. Thưởng và thu nhập tăng thêm xứng đáng so với cống hiến",
          ],
        },
        {
          id: "C8",
          text: "C8. Cách phân chia thu nhập tăng thêm công bằng, khuyến khích nhân viên làm việc tích cực",
          required: true,
          mapToHeaders: [
            "C8. Cách phân chia thu nhập tăng thêm công bằng, khuyến khích nhân viên làm việc tích cực",
          ],
        },
        {
          id: "C9",
          text: "C9. Bảo đảm đóng BHXH, BHYT, khám sức khỏe định kỳ và các hình thức hỗ trợ ốm đau, thai sản đầy đủ",
          required: true,
          mapToHeaders: [
            "C9. Bảo đảm đóng BHXH, BHYT, khám sức khỏe định kỳ và các hình thức hỗ trợ ốm đau, thai sản đầy đủ",
          ],
        },
        {
          id: "C10",
          text: "C10. Tổ chức tham quan, nghỉ dưỡng đầy đủ",
          required: true,
          mapToHeaders: ["C10. Tổ chức tham quan, nghỉ dưỡng đầy đủ"],
        },
        {
          id: "C11",
          text: "C11. Có phong trào thể thao, văn nghệ tích cực",
          required: true,
          mapToHeaders: ["C11. Có phong trào thể thao, văn nghệ tích cực"],
        },
        {
          id: "C12",
          text: "C12. Công đoàn bệnh viện hoạt động tích cực",
          required: true,
          mapToHeaders: ["C12. Công đoàn bệnh viện hoạt động tích cực"],
        },
      ],
    },
    {
      title: "D. Sự hài lòng về công việc, cơ hội học tập và thăng tiến",
      questions: [
        {
          id: "D1",
          text: "D1. Khối lượng công việc được giao phù hợp",
          required: true,
          mapToHeaders: ["D1. Khối lượng công việc được giao phù hợp"],
        },
        {
          id: "D2",
          text: "D2. Công việc chuyên môn đáp ứng nguyện vọng bản thân",
          required: true,
          mapToHeaders: [
            "D2. Công việc chuyên môn đáp ứng nguyện vọng bản thân",
          ],
        },
        {
          id: "D3",
          text: "D3. Bệnh viện tạo điều kiện cho NVYT nâng cao trình độ chuyên môn",
          required: true,
          mapToHeaders: [
            "D3. Bệnh viện tạo điều kiện cho NVYT nâng cao trình độ chuyên môn",
          ],
        },
        {
          id: "D4",
          text: "D4. Bệnh viện tạo điều kiện cho NVYT học tiếp các bậc cao hơn",
          required: true,
          mapToHeaders: [
            "D4. Bệnh viện tạo điều kiện cho NVYT học tiếp các bậc cao hơn",
          ],
        },
        {
          id: "D5",
          text: "D5. Công khai các tiêu chuẩn cho các chức danh lãnh đạo",
          required: true,
          mapToHeaders: [
            "D5. Công khai các tiêu chuẩn cho các chức danh lãnh đạo",
          ],
        },
        {
          id: "D6",
          text: "D6. Bổ nhiệm các chức danh lãnh đạo dân chủ, công bằng",
          required: true,
          mapToHeaders: [
            "D6. Bổ nhiệm các chức danh lãnh đạo dân chủ, công bằng",
          ],
        },
        {
          id: "D7",
          text: "D7. Có cơ hội thăng tiến khi nỗ lực làm việc",
          required: true,
          mapToHeaders: ["D7. Có cơ hội thăng tiến khi nỗ lực làm việc"],
        },
      ],
    },
    {
      title: "E. Sự hài lòng chung về bệnh viện",
      questions: [
        {
          id: "E1",
          text: "E1. Cảm thấy tự hào khi được làm việc tại bệnh viện",
          required: true,
          mapToHeaders: ["E1. Cảm thấy tự hào khi được làm việc tại bệnh viện"],
        },
        {
          id: "E2",
          text: "E2. Đạt được những thành công cá nhân khi làm việc tại bệnh viện",
          required: true,
          mapToHeaders: [
            "E2. Đạt được những thành công cá nhân khi làm việc tại bệnh viện",
          ],
        },
        {
          id: "E3",
          text: "E3. Tin tưởng vào sự phát triển của bệnh viện. trong tương lai",
          required: true,
          mapToHeaders: [
            "E3. Tin tưởng vào sự phát triển của bệnh viện trong tương lai",
          ],
        },
        {
          id: "E4",
          text: "E4. Sẽ gắn bó làm việc tại khoa, phòng hiện tại lâu dài",
          required: true,
          mapToHeaders: [
            "E4. Sẽ gắn bó làm việc tại khoa/phòng hiện tại lâu dài",
          ],
        },
        {
          id: "E5",
          text: "E5. Sẽ gắn bó làm việc tại bệnh viện lâu dài",
          required: true,
          mapToHeaders: ["E5. Sẽ gắn bó làm việc tại bệnh viện lâu dài"],
        },
        {
          id: "E6",
          text: "E6. Mức độ hài lòng nói chung về lãnh đạo bệnh viện",
          required: true,
          mapToHeaders: ["E6. Mức độ hài lòng nói chung về lãnh đạo bệnh viện"],
        },
        {
          id: "E7",
          text: "E7. Tự đánh giá về mức độ hoàn thành công việc tại bệnh viện",
          required: true,
          mapToHeaders: [
            "E7. Tự đánh giá về mức độ hoàn thành công việc tại bệnh viện",
          ],
        },
      ],
    },
  ],
  footer: [
    {
      id: "G_Staff",
      label:
        "G. Anh/Chị có ý kiến hoặc đề xuất nào khác với Bộ Y tế và lãnh đạo bệnh viện?",
      mapToHeader:
        "G. Anh/Chị có ý kiến hoặc đề xuất nào khác với Bộ Y tế và lãnh đạo bệnh viện?",
      type: "textarea",
    },
  ],
};

// ========================================
// DATABASE OBJECT
// ========================================
const db = {
  cache: [],

  async call(action, payload = {}) {
    if (!APPS_SCRIPT_URL) throw new Error("Chưa cấu hình URL Google Sheets!");

    const loadingEl = document.getElementById("loading");
    loadingEl.style.display = "flex";

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, ...payload }),
      });

      const result = await response.json();
      if (result.status === "error")
        throw new Error(result.data || result.message || "Lỗi không xác định");

      return result.data;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    } finally {
      loadingEl.style.display = "none";
    }
  },

  async getAll(force = false) {
    if (this.cache.length > 0 && !force) return this.cache;

    try {
      const rawData = await this.call("read");
      this.cache = rawData.map((row) => ({
        id: row["Mã số phiếu (BV quy định)"] || row["id"],
        timestamp: row["Ngày gửi"] || row["timestamp"],
        type: row["type"] || "form1",
        selenium_status: row["selenium_status"] || "READY",
        ...row,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      this.cache = [];
    }

    return this.cache;
  },

  async save(flatData) {
    // Local backup
    const local = JSON.parse(localStorage.getItem("byt_local_backup") || "[]");
    local.unshift(flatData);
    if (local.length > 100) local.length = 100; // Keep last 100 entries
    localStorage.setItem("byt_local_backup", JSON.stringify(local));

    // Save to Google Sheets
    await this.call("create", { data: flatData });
    this.cache = []; // Clear cache to force refresh
  },

  async delete(ids) {
    await this.call("delete", { ids });
    this.cache = [];
  },

  async update(ids, updates) {
    await this.call("update", { ids, updates });
    this.cache = [];
  },
};

// ========================================
// APP OBJECT
// ========================================
const app = {
  currentForm: null,

  async init() {
    const today = new Date();
    document.getElementById("currentDateHeader").textContent =
      today.toLocaleDateString("vi-VN");

    await this.loadGlobalConfig();

    this.goHome();
    this.updateSessionUI();
  },

  async loadGlobalConfig() {
    const loadingEl = document.getElementById("loading");
    if (loadingEl) loadingEl.style.display = "flex";

    try {
      // Nhận JSON từ Google Sheet
      const configData = await db.call("getConfig");
      if (configData && configData.form1) {
        SESSION_CONFIG = configData;
        localStorage.setItem(
          "BYT_SESSION_CONFIG",
          JSON.stringify(SESSION_CONFIG),
        );
      }
    } catch (e) {
      console.warn("Lỗi tải cấu hình phiên, dùng cache cũ", e);
    } finally {
      if (loadingEl) loadingEl.style.display = "none";
    }
  },

  goHome() {
    this.hideAllViews();
    document.getElementById("landing-view").classList.remove("hidden");
    document.getElementById("landing-view").classList.add("flex");
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  startSurvey(formId) {
    this.hideAllViews();
    document.getElementById("survey-view").classList.remove("hidden");
    survey.switchForm(formId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  showAdmin() {
    this.hideAllViews();
    document.getElementById("admin-view").classList.remove("hidden");
  },

  showPublic() {
    this.goHome();
  },

  hideAllViews() {
    document.getElementById("landing-view").classList.add("hidden");
    document.getElementById("landing-view").classList.remove("flex");
    document.getElementById("survey-view").classList.add("hidden");
    document.getElementById("admin-view").classList.add("hidden");
  },

  showToast(title, message, type = "success") {
    const toast = document.getElementById("toast");
    const toastTitle = document.getElementById("toast-title");
    const toastMsg = document.getElementById("toast-msg");

    toastTitle.textContent = title;
    toastMsg.textContent = message;

    toast.className = toast.className.replace(
      /border-\w+-\d+/,
      type === "error" ? "border-red-500" : "border-teal-500",
    );

    toast.classList.remove("translate-x-full");
    setTimeout(() => toast.classList.add("translate-x-full"), 3000);
  },

  updateSessionUI() {
    const statusDiv = document.getElementById("admin-session-status");
    if (!statusDiv) return;

    // Check kỹ xem có chuẩn 3 mẫu không
    if (!SESSION_CONFIG || !SESSION_CONFIG.form1) {
      statusDiv.innerHTML = '<span class="text-gray-400">Chưa cấu hình</span>';
      return;
    }

    // Helper rút gọn chữ
    const shortText = (txt) =>
      txt ? txt.split(".")[0] : '<span class="text-red-400">Chưa chọn</span>';

    statusDiv.innerHTML = `
      <div class="mb-2">
        <span class="font-bold text-teal-700 block">Mẫu 1 & 2:</span>
        <div class="pl-2 border-l-2 border-teal-200 mt-1">
          PV: ${shortText(SESSION_CONFIG.form1.nguoipv)}<br>
          TL: ${shortText(SESSION_CONFIG.form1.nguoi_tra_loi)}
        </div>
      </div>
      <div>
        <span class="font-bold text-purple-700 block">Mẫu 3:</span>
        <div class="pl-2 border-l-2 border-purple-200 mt-1">
          Kiểu: ${shortText(SESSION_CONFIG.form3.kieu_khao_sat)}
        </div>
      </div>
    `;
  },
};

// ========================================
// SURVEY OBJECT
// ========================================
const survey = {
  switchForm(id) {
    app.currentForm =
      id === 1 ? form1Structure : id === 2 ? form2Structure : form3Structure;

    const titleEl = document.getElementById("current-form-title");
    if (titleEl) {
      titleEl.textContent = app.currentForm.title;
    }

    this.render();
  },

  render() {
    const container = document.getElementById("surveyForm");
    container.innerHTML = "";

    this.renderDemographics(container);

    app.currentForm.sections.forEach((section) => {
      this.renderSection(container, section);
    });

    this.renderFooter(container);
    this.renderSubmitButton(container);
  },

  renderDemographics(container) {
    const infoFields = ["kieu_khao_sat", "nguoipv", "nguoi_tra_loi"];

    const infoDiv = document.createElement("div");
    infoDiv.className =
      "bg-white p-6 rounded-xl shadow-sm border border-gray-100";
    infoDiv.innerHTML = `
      <h2 class="font-bold border-b pb-2 mb-4">I. THÔNG TIN</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="info-grid"></div>
    `;
    const infoGrid = infoDiv.querySelector("#info-grid");

    app.currentForm.demographics
      .filter((field) => infoFields.includes(field.id))
      .forEach((field) => {
        infoGrid.appendChild(this.createField(field));
      });
    container.appendChild(infoDiv);

    const demoDiv = document.createElement("div");
    demoDiv.className =
      "bg-white p-6 rounded-xl shadow-sm border border-gray-100";
    demoDiv.innerHTML = `
      <h2 class="font-bold border-b pb-2 mb-4">II. THÔNG TIN NGƯỜI BỆNH/NHÂN VIÊN</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="demo-grid"></div>
    `;
    const demoGrid = demoDiv.querySelector("#demo-grid");

    app.currentForm.demographics
      .filter((field) => !infoFields.includes(field.id))
      .forEach((field) => {
        demoGrid.appendChild(this.createField(field));
      });
    container.appendChild(demoDiv);
  },

  renderSection(container, section) {
    const div = document.createElement("div");
    div.className = "bg-white p-6 rounded-xl shadow-sm border border-gray-100";
    div.innerHTML = `<h2 class="font-bold text-teal-700 mb-4">${section.title}</h2>`;

    section.questions.forEach((question) => {
      div.appendChild(this.createQuestion(question));
    });

    container.appendChild(div);
  },

  renderFooter(container) {
    const div = document.createElement("div");
    div.className = "bg-white p-6 rounded-xl shadow-sm border border-gray-100";
    div.innerHTML = `
            <h2 class="font-bold border-b pb-2 mb-4">THÔNG TIN KHÁC</h2>
            <div class="space-y-4" id="footer-grid"></div>
        `;

    const grid = div.querySelector("#footer-grid");
    app.currentForm.footer.forEach((field) => {
      grid.appendChild(this.createField(field));
    });

    container.appendChild(div);
  },

  renderSubmitButton(container) {
    const div = document.createElement("div");
    div.className = "sticky bottom-4 z-40";
    div.innerHTML = `
            <button type="submit" class="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg transition">
                GỬI PHIẾU KHẢO SÁT
            </button>
        `;
    container.appendChild(div);
  },

  createField(field) {
    const div = document.createElement("div");
    div.className =
      field.width === "full" ? "col-span-1 md:col-span-2" : "col-span-1";
    div.id = `${field.id}_container`;

    // --- LOGIC: Check giá trị Session Config ---
    let prefilledValue = "";
    let isReadOnly = false;

    if (SESSION_CONFIG && SESSION_CONFIG[app.currentForm.id]) {
      const configVal = SESSION_CONFIG[app.currentForm.id][field.id];
      if (configVal) {
        prefilledValue = configVal;
        isReadOnly = true; // Sẽ làm mờ và chặn click
      }
    }
    // -----------------------------------------------

    const req = field.required ? "required" : "";
    let inputHTML = "";

    // Thêm class readonly nếu được Admin pre-fill
    const readOnlyClass = isReadOnly
      ? "pointer-events-none bg-gray-100 opacity-80"
      : "bg-white";
    const baseInputClass = `w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-base appearance-none shadow-sm ${readOnlyClass}`;

    switch (field.type) {
      case "select":
        inputHTML = `
            <div class="relative">
                <select name="${field.id}" ${req} class="${baseInputClass} pr-8" ${isReadOnly ? 'tabindex="-1"' : ""}>
                    <option value="">-- Chạm để chọn --</option>
                    ${field.options.map((opt) => `<option value="${opt}" ${opt === prefilledValue ? "selected" : ""}>${opt}</option>`).join("")}
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <i class="fas fa-chevron-down text-xs"></i>
                </div>
            </div>
        `;
        break;

      case "radio":
        inputHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                ${field.options
                  .map(
                    (opt) => `
                    <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer active:bg-teal-50 transition select-none">
                        <input type="radio" name="${field.id}" value="${opt}" ${req} 
                            class="w-5 h-5 text-teal-600 focus:ring-teal-500 border-gray-300 mr-3">
                        <span class="text-sm font-medium text-gray-700">${opt}</span>
                    </label>
                `,
                  )
                  .join("")}
            </div>
        `;
        break;

      case "textarea":
        inputHTML = `
            <textarea name="${field.id}" rows="3" ${req} 
                class="${baseInputClass}" 
                placeholder="Nhập ý kiến của bạn..."></textarea>
        `;
        break;

      default:
        inputHTML = `
            <div class="relative">
                <input type="${field.type}" name="${field.id}" ${req} 
                    class="${baseInputClass}" 
                    placeholder="${field.placeholder || ""}"
                    ${field.type === "number" ? 'pattern="[0-9]*" inputmode="numeric"' : ""}> 
                ${field.suffix ? `<span class="absolute right-3 top-3 text-gray-400 font-bold">${field.suffix}</span>` : ""}
            </div>
        `;
    }

    div.innerHTML = `
        <div class="mb-4">
            <label class="block text-sm font-bold mb-2 text-gray-700 uppercase tracking-wide">
                ${field.label} 
                ${field.required ? '<span class="text-red-500">*</span>' : ""}
            </label>
            ${inputHTML}
            <div class="text-xs text-red-500 hidden mt-2 error-msg font-medium">
                <i class="fas fa-info-circle"></i> Vui lòng nhập thông tin này
            </div>
        </div>
    `;

    return div;
  },

  createQuestion(question) {
    const div = document.createElement("div");
    div.className = "survey-card relative transition-all duration-300";
    div.id = `${question.id}_container`;

    let optionsHTML = "";

    if (question.isCost) {
      const costOptions = [
        "1. Rất đắt so với chất lượng",
        "2. Đắt hơn so với chất lượng",
        "3. Tương xứng so với chất lượng",
        "4. Rẻ hơn so với chất lượng",
        "5. Không tự chi trả / Không biết",
        "6. Ý kiến khác",
      ];

      optionsHTML = `
        <div class="mt-3 space-y-2">
            ${costOptions
              .map((opt) => {
                return `
                <label class="flex items-start p-3 border border-gray-100 rounded-lg hover:bg-teal-50 cursor-pointer active:bg-teal-100 transition select-none">
                    <input type="radio" name="${question.id}" value="${opt}" required 
                        class="mt-1 mr-3 w-5 h-5 text-teal-600 border-gray-300 focus:ring-teal-500 shrink-0">
                    <span class="text-sm text-gray-700 leading-snug">${opt}</span>
                </label>
            `;
              })
              .join("")}
        </div>
      `;
    } else {
      const labels = ["Rất kém", "Kém", "TB", "Tốt", "Rất tốt"];

      optionsHTML = `
        <div class="mt-4">
            <div class="flex justify-between items-start w-full px-1">
                ${[1, 2, 3, 4, 5]
                  .map(
                    (val) => `
                    <div class="flex flex-col items-center group w-1/5">
                        <input type="radio" name="${question.id}" id="${question.id}_${val}" value="${val}" required class="rating-input">
                        <label for="${question.id}_${val}" class="rating-label shadow-sm">
                            ${val}
                        </label>
                        <span class="rating-text">${labels[val - 1]}</span>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        </div>
      `;
    }

    div.innerHTML = `
        <div class="mb-2">
            <span class="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded mb-1 inline-block">
                ${question.id.replace("S_", "")}
            </span>
            <h3 class="font-medium text-gray-800 question-text text-base md:text-lg">
                ${question.text} 
                ${question.required ? '<span class="text-red-500 ml-1">*</span>' : ""}
            </h3>
        </div>
        ${optionsHTML}
        <div class="text-xs text-red-500 hidden mt-3 font-bold error-msg flex items-center bg-red-50 p-2 rounded">
            <i class="fas fa-exclamation-circle mr-1"></i> Vui lòng chọn đáp án
        </div>
    `;

    return div;
  },

  validate(formData) {
    document
      .querySelectorAll(".error-highlight")
      .forEach((el) => el.classList.remove("error-highlight"));
    document
      .querySelectorAll(".error-msg")
      .forEach((el) => el.classList.add("hidden"));

    let firstError = null;

    app.currentForm.demographics.forEach((field) => {
      if (field.required && !formData.get(field.id)) {
        const container = document.getElementById(`${field.id}_container`);
        if (container) {
          container.classList.add("error-highlight");
          container.querySelector(".error-msg").classList.remove("hidden");
          if (!firstError) firstError = container;
        }
      }
    });

    app.currentForm.sections.forEach((section) => {
      section.questions.forEach((question) => {
        if (question.required && !formData.get(question.id)) {
          const container = document.getElementById(`${question.id}_container`);
          if (container) {
            container.classList.add("error-highlight");
            container.querySelector(".error-msg").classList.remove("hidden");
            if (!firstError) firstError = container;
          }
        }
      });
    });

    app.currentForm.footer.forEach((field) => {
      if (field.required && !formData.get(field.id)) {
        const container = document.getElementById(`${field.id}_container`);
        if (container) {
          container.classList.add("error-highlight");
          container.querySelector(".error-msg").classList.remove("hidden");
          if (!firstError) firstError = container;
        }
      }
    });

    if (firstError) {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    return true;
  },

  async handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    if (!this.validate(formData)) return;

    const rawData = Object.fromEntries(formData.entries());
    const now = new Date();

    const payload = {
      "Kiểu khảo sát": rawData["kieu_khao_sat"] || "",
      "Mã số phiếu": "",
      "Tên bệnh viện": DEFAULT_HOSPITAL,
      "Mã bệnh viện": "16410",
      "Ngày điền phiếu": now.toLocaleDateString("vi-VN"),
      "Người phỏng vấn/điền phiếu": rawData["nguoipv"] || "",
      "Người trả lời": rawData["nguoi_tra_loi"] || "",
    };

    // CORRECTED LOGIC: Use mapToHeader for payload keys
    app.currentForm.demographics.forEach((field) => {
      if (field.mapToHeader) {
        payload[field.mapToHeader] = rawData[field.id] || "";
      }
    });

    app.currentForm.sections.forEach((section) => {
      section.questions.forEach((question) => {
        const value = rawData[question.id];
        if (question.mapToHeaders) {
          question.mapToHeaders.forEach((header) => {
            payload[header] = value;
          });
        }
      });
    });

    // CORRECTED LOGIC: Use mapToHeader for footer payload keys
    app.currentForm.footer.forEach((field) => {
      if (field.mapToHeader) {
        payload[field.mapToHeader] = rawData[field.id] || "";
      } else {
        // Fallback for fields without mapToHeader (should not happen with new structure)
        payload[field.label] = rawData[field.id] || "";
      }
    });

    const uniqueId = Date.now().toString().slice(-8);

    payload["Mã số phiếu (BV quy định)"] = uniqueId;
    payload["id"] = uniqueId;
    payload["timestamp"] = now.toISOString();
    payload["type"] = app.currentForm.id;
    payload["selenium_status"] = "READY";

    payload["python_data"] = JSON.stringify(rawData);

    try {
      await db.save(payload);

      app.showToast("Thành công", "Đã gửi phiếu khảo sát!");

      event.target.reset();

      setTimeout(() => {
        app.goHome();
      }, 1500);
    } catch (error) {
      console.error("Submit error:", error);
      app.showToast("Lỗi", "Không thể gửi phiếu: " + error.message, "error");
    }
  },
};
