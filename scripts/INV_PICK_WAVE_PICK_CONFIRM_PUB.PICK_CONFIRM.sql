DECLARE 
   l_return_status      VARCHAR2(1);
   l_msg_count          NUMBER;
   l_msg_data           VARCHAR2(4000);
   l_delivery_detail_id NUMBER;
BEGIN
   INV_PICK_WAVE_PICK_CONFIRM_PUB.PICK_CONFIRM(
      p_api_version_number => 1.0,
      x_return_status      => l_return_status,
      x_msg_count          => l_msg_count,
      x_msg_data           => l_msg_data,
      p_delivery_detail_id => l_delivery_detail_id,
      p_quantity           => 10,
      p_user_id            => FND_GLOBAL.USER_ID
   );
END;
