import { Home } from "~/presentation/Home";
import { Route } from "../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Write a message to Jenna' },
    { name: "description", content: '' },
  ];
}

export default function HomeRoute() {
  return (<div>
    <Home/>
  </div>);
}