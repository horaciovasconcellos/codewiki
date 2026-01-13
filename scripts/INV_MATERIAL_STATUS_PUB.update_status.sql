BEGIN
   -- Initialize variables
   l_object_type  := 'H';   
   -- 'O' = Lot , 'S' = Serial, 'Z' = Subinventory, 'L' = Locator, 'H' = Onhand
    l_status_rec.organization_id       := 143;
    l_status_rec.inventory_item_id     := 165432;
    l_status_rec.lot_number            := 'LOT2025';
    l_status_rec.zone_code             := 'RIP';
    l_status_rec.locator_id            := NULL;
    l_status_rec.status_id             := 1;    
    -- select status_id, status_code from mtl_material_statuses_vl;
    l_status_rec.update_reason_id      := 305;  
    l_status_rec.update_method         := 2;      
    INV_MATERIAL_STATUS_PUB.update_status
        (  p_api_version_number   =>    l_api_version 
         , p_init_msg_lst         =>    l_init_msg_list       
         , p_commit               =>    l_commit             
         , x_return_status        =>    l_return_status      
         , x_msg_count            =>    l_msg_count          
         , x_msg_data             =>    l_msg_data           
         , p_object_type          =>    l_object_type        
         , p_status_rec           =>    l_status_rec         
         );
   IF (x_return_status <> FND_API.G_RET_STS_SUCCESS) 
   THEN
      DBMS_OUTPUT.PUT_LINE('Error Message :'||x_msg_data);
   END IF;
   
END;
