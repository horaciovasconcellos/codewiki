DECLARE
   l_operation            VARCHAR2(30) := 'Pick Release from Delivery';
   l_return_status        VARCHAR2(1) ;
   l_msg_data             VARCHAR2(2000);
   l_msg_count            NUMBER;
   --Standard Parameters.
   l_api_version_number   NUMBER;
   l_init_msg_list          VARCHAR2(30);
   l_msg_details          VARCHAR2(3000);
   l_msg_summary          VARCHAR2(3000);
   l_validation_level     NUMBER;
   l_commit               VARCHAR2(30);
   --Parameters for WSH_DELIVERIES_PUB.Delivery_Action.
   l_action_code          VARCHAR2(15);
   l_delivery_id          NUMBER;
   l_delivery_name        VARCHAR2(30);
   l_sc_action_flag       VARCHAR2(10);
   l_sc_close_trip_flag   VARCHAR2(10);
   l_sc_create_bol_flag   VARCHAR2(10);
   l_sc_stage_del_flag    VARCHAR2(10);
   l_wv_override_flag     VARCHAR2(10);
   l_trip_id              VARCHAR2(30);
   l_trip_name            VARCHAR2(30);
BEGIN
   l_return_status := WSH_UTIL_CORE.G_RET_STS_SUCCESS;
   FND_GLOBAL.APPS_INITIALIZE(
       user_id          => 1234 -- User ID
      ,resp_id          => 21623 -- Order Management Super User
      ,resp_appl_id     => 660  -- Order Management
     );
    -- Delivery Action API (Pick Release)
    l_action_code := 'PICK-RELEASE';
    WSH_DELIVERIES_PUB.DELIVERY_ACTION
       (
         p_api_version_number   => 1.0
       , p_init_msg_list        => init_msg_list
       , x_return_status        => l_return_status
       , x_msg_count            => l_msg_count
       , x_msg_data             => l_msg_data
       , p_action_code          => l_action_code
       , p_delivery_id          => l_delivery_id
       , p_delivery_name        => l_delivery_name
       , p_sc_action_flag       => l_sc_action_flag
       , p_sc_close_trip_flag   => l_sc_close_trip_flag
       , p_sc_create_bol_flag   => l_sc_create_bol_flag
       , p_sc_stage_del_flag    => l_sc_stage_del_flag
       , p_wv_override_flag     => l_wv_override_flag
       , x_trip_id              => l_trip_id
       , x_trip_name            => l_trip_name
       );
   IF x_return_status = WSH_UTIL_CORE.G_RET_STS_SUCCESS 
   THEN
      dbms_output.put_line( l_operation ||' done successfully.' ) ;
      commit;
   END IF ;
END ;
