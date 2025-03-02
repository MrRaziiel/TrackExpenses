import React from 'react';
import {Link} from "react-router-dom";

export const Navbar = () =>{
    return(
        <nav>
            <ul>
                <li>
                    <Link>About</Link>
                    </li>
                <li>
                    <Link>Services</Link>
                </li>
                <li>
                    <Link>Contact</Link>
                </li>
            </ul>
        </nav>
    )
}