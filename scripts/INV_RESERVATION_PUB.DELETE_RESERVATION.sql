DECLARE 
   l_resv_rec      inv_reservation_global.mtl_reservation_rec_type;
   l_return_status VARCHAR2(1);
   l_msg_count     NUMBER;
   l_msg_data      VARCHAR2(4000);
BEGIN
   FND_GLOBAL.APPS_INITIALIZE(
       user_id          => 1234 -- User ID
      ,resp_id          => 21623 -- Inventory
      ,resp_appl_id     => 660  -- Inventory
     );
   l_resv_rec.reservation_id               := p_reservation_id;
   INV_RESERVATION_PUB.DELETE_RESERVATION
                           (p_api_version_number        => 1.0,
                            p_init_msg_lst              => fnd_api.g_true,
                            x_return_status             => l_return_status,
                            x_msg_count                 => l_msg_count,
                            x_msg_data                  => l_msg_data,
                            p_rsv_rec                   => l_resv_rec,
                            p_serial_number             => l_dummy_sn
                           );
       IF l_status = fnd_api.g_ret_sts_success
       THEN
          COMMIT;
       ELSE
          IF l_msg_count >= 1
          THEN
             FOR i IN 1..l_msg_count
             LOOP
                l_msg_data  := SUBSTR(fnd_msg_pub.get(p_encoded => fnd_api.g_false ),1, 255);
             END LOOP;
          END IF;
       END IF;
   END;
