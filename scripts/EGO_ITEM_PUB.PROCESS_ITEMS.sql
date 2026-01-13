DECLARE
   x_item_tbl		EGO_ITEM_PUB.ITEM_TBL_TYPE;     
   l_message_list   Error_Handler.Error_Tbl_Type;
   l_return_status	VARCHAR2(2);
   l_msg_count		NUMBER      := 0;
   l_user_id		NUMBER      := -1;
   l_resp_id		NUMBER      := -1;
   l_application_id NUMBER      := -1;
   l_rowcnt		    NUMBER      := 1;
   l_api_version	NUMBER      := 1.0; 
   l_init_msg_list	VARCHAR2(2) := FND_API.G_TRUE; 
   l_commit	        VARCHAR2(2) := FND_API.G_FALSE; 
   l_item_tbl		EGO_ITEM_PUB.ITEM_TBL_TYPE; 
   l_role_grant_tbl EGO_ITEM_PUB.ROLE_GRANT_TBL_TYPE; 
   l_user_name		VARCHAR2(30):= 'SYSADMIN';
   l_resp_name		VARCHAR2(30):= 'Inventory';    
   l_item_catalog_group_id NUMBER := 0;      
BEGIN    
    FND_GLOBAL.APPS_INITIALIZE(l_user_id, l_resp_id, l_application_id);  
    mo_global.set_policy_context('S', 81);
    l_item_tbl(l_rowcnt).transaction_type            := 'CREATE'; 
    l_item_tbl(l_rowcnt).segment1                    := 'TEST-ITEM2506';            
    l_item_tbl(l_rowcnt).description                 := 'Enodeas 5MM Item';            
    l_item_tbl(l_rowcnt).organization_code           := 'MST';                     
    l_item_tbl(l_rowcnt).primary_uom_code            := 'EA';
    l_item_tbl(l_rowcnt).template_name               := 'MFG Finished Good';        
    l_item_tbl(l_rowcnt).inventory_item_status_code  := 'Active';                 
    -- call API to load Items
   DBMS_OUTPUT.PUT_LINE('Calling EGO_ITEM_PUB.Process_Items API');        
   EGO_ITEM_PUB.PROCESS_ITEMS( 
                  p_api_version    => l_api_version
                 ,p_init_msg_list  => l_init_msg_list
                 ,p_commit         => l_commit
                 ,p_item_tbl       => l_item_tbl
                 ,p_role_grant_tbl => l_role_grant_tbl
                 ,x_item_tbl       => x_item_tbl
                 ,x_return_status  => l_return_status
                 ,x_msg_count      => l_msg_count
                 );
   IF (l_return_status = FND_API.G_RET_STS_SUCCESS) 
   THEN
      FOR i IN 1..x_item_tbl.COUNT LOOP
         DBMS_OUTPUT.PUT_LINE('Inventory Item Id :'||to_char(x_item_tbl(i).inventory_item_id));
      END LOOP;
   ELSE
      Error_Handler.GET_MESSAGE_LIST
          (x_message_list=>l_message_list);
      FOR i IN 1..l_message_list.COUNT 
	    LOOP
         DBMS_OUTPUT.PUT_LINE(l_message_list(i).message_text);
      END LOOP;
   END IF;     
EXCEPTION
   WHEN OTHERS THEN
     DBMS_OUTPUT.PUT_LINE('Exception Occured:'||SQLERRM);
   RAISE;
END;
