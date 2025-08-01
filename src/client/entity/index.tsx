import React, { useCallback } from "react";
import Layout from "../common/Layout"
import { useNavigate } from "react-router-dom";
import HierarchicalTree from "./entityHiearchy";

const Entity : React.FC = () =>{

    const navigate = useNavigate();

    const PageChange = useCallback( () => {
        navigate("/entity/create");
    },[navigate]);

    return(
        <Layout title="Entity Hierarchy" showButton={true} buttonText="Create Entity" onButtonClick={PageChange}>
            <HierarchicalTree />
        </Layout>
    )
}

export default Entity;