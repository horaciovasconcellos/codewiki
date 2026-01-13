DECLARE
   l_api_version	   NUMBER        := 1.0; 
   l_return_status	   VARCHAR2(10);  
   l_msg_count		   NUMBER        := 0;
   l_msg_data          VARCHAR2(255) ;
	 l_organization_id   NUMBER        := 83;
   l_organization_code VARCHAR2(10)  := 'ORG';
	 l_subinventory_code VARCHAR2(10)  := 'FG';
	 l_loc_segments      VARCHAR2(90)  := 'TST1.TST2.TST3';
	 l_description       VARCHAR2(200) := 'Test Locators';
	 l_locator_type      VARCHAR2(60);
	 l_status_id         NUMBER        := NULL;
   l_locator_id         NUMBER       := NULL;
   l_locator_exists		VARCHAR2(1)  := 'N';
BEGIN
   INV_LOC_WMS_PUB.CREATE_LOCATOR 
					  ( x_return_status	         => l_return_status	 
					  , x_msg_count		           => l_msg_count		 
					  , x_msg_data		           => l_msg_data		 
					  , x_inventory_location_id  => l_locator_id
					  , x_locator_exists	       => l_locator_exists	 
					  , p_organization_id        => l_organization_id
					  , p_organization_code      => l_organization_code
					  , p_concatenated_segments  => l_loc_segments
					  , p_description            => l_description
					  , p_inventory_location_type=> l_locator_type
					  , p_subinventory_code      => l_subinventory_code
					  , p_status_id            	 => l_status_id 
					  );
END;
