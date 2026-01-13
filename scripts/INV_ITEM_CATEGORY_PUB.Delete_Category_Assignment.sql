declare
   l_return_status VARCHAR2(80);
   l_error_code NUMBER;
   l_msg_count NUMBER;
   l_msg_data VARCHAR2(80);
   l_category_id NUMBER;
   l_category_set_id NUMBER;
   l_Inventory_item_id NUMBER;
   l_organization_id NUMBER;
begin
   --Category Set
   SELECT mcs_tl.CATEGORY_SET_ID 
     INTO l_category_set_id
     FROM mtl_category_sets_tl mcs_tl
    WHERE mcs_tl.CATEGORY_SET_NAME = 'HOME_INTERIOR';
   --category id
   SELECT mcb.CATEGORY_ID
     INTO l_category_id
     FROM mtl_categories_b      mcb,
          mtl_category_sets_b   mcs_b,
          mtl_category_sets_tl  mcs_tl
    WHERE mcb.SEGMENT1 = 'SOFA'
      AND mcb.SEGMENT2 = 'MEDIUM'
      AND mcb.STRUCTURE_ID = mcs_b.STRUCTURE_ID
      AND mcs_b.CATEGORY_SET_ID = mcs_tl.CATEGORY_SET_ID
      AND mcs_tl.CATEGORY_SET_NAME = 'HOME_INTERIOR';
   --Item id
   SELECT DISTINCT(INVENTORY_ITEM_ID)
     INTO l_inventory_item_id
     FROM mtl_system_items_kfv msik
    WHERE msik.concatenated_segments = 'SOFA.MEDIUM';
   --Get organization id
   SELECT organization_id
     INTO l_organization_id
     FROM mtl_parameters
    WHERE organization_code = 'V1';
   --call api Delete_Category_Assignment
   INV_ITEM_CATEGORY_PUB.Delete_Category_Assignment
      (
       p_api_version       => 1.0,
       p_init_msg_list     => FND_API.G_FALSE,
       p_commit            => FND_API.G_TRUE,
       x_return_status     => l_return_status,
       x_errorcode         => l_error_code,
       x_msg_count         => l_msg_count,
       x_msg_data          => l_msg_data,
       p_category_id       => l_category_id,
       p_category_set_id   => l_category_set_id,
       p_inventory_item_id => l_Inventory_item_id,
       p_organization_id   =>l_organization_id
      );
    END;
