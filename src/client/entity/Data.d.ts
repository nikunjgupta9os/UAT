export interface TreeNodeType {
  id: string;
  name: string;
  data: {
    entity_name: string;
    parentname?: string;
    is_top_level_entity: boolean;
    address: string;
    contact_phone: string;
    contact_email: string;
    registration_number?: string;
    pan_gst?: string;
    legal_entity_identifier?: string;
    tax_identification_number?: string;
    default_currency?: string;
    associated_business_units?: string[];
    reporting_currency: string;
    unique_identifier: string;
    legal_entity_type: string;
    fx_trading_authority: string;
    internal_fx_trading_limit: string;
    associated_treasury_contact: string;
    is_deleted: boolean;
    approval_status: string;
    level: string;
  };
  children?: TreeNodeType[];
}
